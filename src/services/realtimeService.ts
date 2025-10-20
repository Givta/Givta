import { ChallengesCollection, ChallengeParticipant, ChallengeTipsCollection } from '../collections/challenges';
import { DeviceEventEmitter } from 'react-native';

export enum RealtimeEvent {
  // Challenge Events
  CHALLENGE_TIP_RECEIVED = 'challenge:tip_received',
  CHALLENGE_PARTICIPANT_JOINED = 'challenge:participant_joined',
  CHALLENGE_RANKING_UPDATED = 'challenge:ranking_updated',
  CHALLENGE_STATUS_CHANGED = 'challenge:status_changed',
  CHALLENGE_PRIZES_DISTRIBUTED = 'challenge:prizes_distributed',

  // User Events
  USER_RANKING_CHANGED = 'user:ranking_changed',
  USER_WON_CHALLENGE = 'user:won_challenge',
  USER_RECEIVED_PRIZE = 'user:received_prize',

  // Notification Events
  NOTIFICATION_NEW_TIP = 'notification:new_tip',
  NOTIFICATION_RANK_CHANGE = 'notification:rank_change',
  NOTIFICATION_CHALLENGE_ENDING = 'notification:challenge_ending',
  NOTIFICATION_WINNINGS_AVAILABLE = 'notification:winnings_available'
}

export interface TipEventData {
  challengeId: string;
  tipperId: string;
  tipperName: string;
  participantId: string;
  participantName: string;
  amount: number;
  currency: string;
  timestamp: Date;
  anonymous: boolean;
  message?: string;
}

export interface RankingEventData {
  challengeId: string;
  participantId: string;
  participantName: string;
  oldRank: number;
  newRank: number;
  totalTips: number;
  amount: number;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

class RealtimeService {
  private eventListeners: Map<string, Function[]> = new Map();
  private activeChallengeRoom: string | null = null;
  private pollingIntervals: Map<string, any> = new Map();

  /**
   * Subscribe to a specific event
   */
  on(event: RealtimeEvent, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from a specific event
   */
  off(event: RealtimeEvent, callback?: Function): void {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: RealtimeEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }

    // Also emit via DeviceEventEmitter for React components
    DeviceEventEmitter.emit(event, data);
  }

  /**
   * Join a challenge room (simulated with polling for now)
   */
  joinChallengeRoom(challengeId: string): void {
    if (this.activeChallengeRoom === challengeId) return;

    // Leave any existing room
    this.leaveChallengeRoom();

    this.activeChallengeRoom = challengeId;
    console.log(`RealtimeService: Joined challenge room ${challengeId}`);

    // Start polling for updates (simulates real-time)
    this.startPollingChallenge(challengeId);
  }

  /**
   * Leave challenge room
   */
  leaveChallengeRoom(challengeId?: string): void {
    if (this.activeChallengeRoom && (!challengeId || this.activeChallengeRoom === challengeId)) {
      this.stopPollingChallenge(this.activeChallengeRoom);
      console.log(`RealtimeService: Left challenge room ${this.activeChallengeRoom}`);
      this.activeChallengeRoom = null;
    }
  }

  /**
   * Start polling challenge for updates
   */
  private startPollingChallenge(challengeId: string): void {
    // Stop existing polling if any
    this.stopPollingChallenge(challengeId);

    let lastUpdate: any = null;

    const pollInterval = setInterval(async () => {
      try {
        const challenge = await ChallengesCollection.getById(challengeId);
        if (!challenge) return;

        // Simplified polling - just check for tip amount changes
        if (lastUpdate?.totalAmount !== challenge.totalAmount) {
          // Emit tip received event (simplified)
          this.emit(RealtimeEvent.CHALLENGE_TIP_RECEIVED, {
            challengeId,
            amount: challenge.totalAmount,
            timestamp: new Date()
          });
        }

        // Update last update
        lastUpdate = {
          totalAmount: challenge.totalAmount,
          totalTips: challenge.totalTips
        };

      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds (adjust as needed)

    this.pollingIntervals.set(challengeId, pollInterval);
  }

  /**
   * Stop polling challenge
   */
  private stopPollingChallenge(challengeId: string): void {
    const interval = this.pollingIntervals.get(challengeId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(challengeId);
    }
  }

  /**
   * Broadcast tip event (simulated)
   */
  broadcastTipEvent(tipData: TipEventData): void {
    this.emit(RealtimeEvent.CHALLENGE_TIP_RECEIVED, tipData);
  }

  /**
   * Broadcast ranking update (simulated)
   */
  broadcastRankingUpdate(rankingData: RankingEventData): void {
    this.emit(RealtimeEvent.CHALLENGE_RANKING_UPDATED, rankingData);
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.activeChallengeRoom !== null;
  }

  /**
   * Clean up all connections
   */
  disconnect(): void {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    this.eventListeners.clear();
    this.activeChallengeRoom = null;
    console.log('RealtimeService: Disconnected');
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// ===== Expo Push Notifications Integration =====
import * as Notifications from 'expo-notifications';

export class PushNotificationService {
  static initialize() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: true,
      }),
    });

    // Request permissions
    this.requestPermissions();
  }

  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Get token for push notifications
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Notification token:', token);
    // Send token to server for push notifications
    return true;
  }

  static async showLocalNotification(title: string, message: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: message,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }

  static async scheduleNotification(title: string, message: string, date: Date, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: message,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Schedule for immediate display for demo
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static setupNotificationListener() {
    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const { data } = notification.request.content;

      // Handle different notification types
      if (data && data.type) {
        switch (data.type) {
          case 'new_tip':
            DeviceEventEmitter.emit('notification:new_tip', data);
            break;

          case 'ranking_change':
            DeviceEventEmitter.emit('notification:ranking_change', data);
            break;

          case 'challenge_ending':
            DeviceEventEmitter.emit('notification:challenge_ending', data);
            break;

          case 'winnings_available':
            DeviceEventEmitter.emit('notification:winnings_available', data);
            break;
        }
      }
    });

    return notificationListener;
  }
}

// ===== Enhanced Challenge Collection with Real-time Updates =====
export class RealtimeChallengeService {
  /**
   * Add tip with real-time broadcasting
   */
  static async addTipWithRealtime(
    challengeId: string,
    amount: number,
    tipperId: string,
    tipperName: string,
    participantId?: string
  ): Promise<void> {
    try {
      // Simplified - just create tip and update challenge totals
      await ChallengeTipsCollection.create({
        challengeId,
        participantId: participantId || tipperId,
        tipperId,
        amount,
        currency: 'NGN',
        isAnonymous: false,
        fee: amount * 0.05,
        netAmount: amount * 0.95,
        paymentStatus: 'completed'
      });

      // Update challenge totals
      const challenge = await ChallengesCollection.getById(challengeId);
      if (!challenge) return;

      await ChallengesCollection.update(challengeId, {
        totalTips: (challenge.totalTips || 0) + 1,
        totalAmount: (challenge.totalAmount || 0) + amount
      });

      // Broadcast real-time tip event
      const tipEvent: TipEventData = {
        challengeId,
        tipperId,
        tipperName,
        participantId: participantId || tipperId,
        participantName: tipperName,
        amount,
        currency: 'NGN',
        timestamp: new Date(),
        anonymous: false
      };

      realtimeService.broadcastTipEvent(tipEvent);

    } catch (error) {
      console.error('Failed to add tip with real-time updates:', error);
      throw error;
    }
  }

  /**
   * Subscribe to challenge updates
   */
  static subscribeToChallenge(challengeId: string, callbacks: {
    onTipReceived?: (data: TipEventData) => void;
    onRankingUpdated?: (data: RankingEventData) => void;
    onParticipantJoined?: (data: any) => void;
  } = {}) {
    // Join challenge room
    realtimeService.joinChallengeRoom(challengeId);

    // Set up event listeners
    if (callbacks.onTipReceived) {
      realtimeService.on(RealtimeEvent.CHALLENGE_TIP_RECEIVED, callbacks.onTipReceived);
    }

    if (callbacks.onRankingUpdated) {
      realtimeService.on(RealtimeEvent.CHALLENGE_RANKING_UPDATED, callbacks.onRankingUpdated);
    }

    if (callbacks.onParticipantJoined) {
      realtimeService.on(RealtimeEvent.CHALLENGE_PARTICIPANT_JOINED, callbacks.onParticipantJoined);
    }

    // Return unsubscribe function
    return () => {
      realtimeService.leaveChallengeRoom(challengeId);
      if (callbacks.onTipReceived) {
        realtimeService.off(RealtimeEvent.CHALLENGE_TIP_RECEIVED, callbacks.onTipReceived);
      }
      if (callbacks.onRankingUpdated) {
        realtimeService.off(RealtimeEvent.CHALLENGE_RANKING_UPDATED, callbacks.onRankingUpdated);
      }
      if (callbacks.onParticipantJoined) {
        realtimeService.off(RealtimeEvent.CHALLENGE_PARTICIPANT_JOINED, callbacks.onParticipantJoined);
      }
    };
  }

  /**
   * Update challenge status
   */
  static async updateChallengeStatus(
    challengeId: string,
    status: any
  ): Promise<void> {
    await ChallengesCollection.update(challengeId, { status });
  }
}
