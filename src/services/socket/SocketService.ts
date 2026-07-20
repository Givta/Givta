// Real Socket.IO client implementation for Challenge System

import io, { Socket } from 'socket.io-client';

interface SocketEventCallback {
  (...args: any[]): void;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private eventListeners = new Map<string, SocketEventCallback[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connected = false;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.connected = true;
        resolve(this.socket);
        return;
      }

      // Connect to your backend server
      // Update with your actual backend server URL
      const SERVER_URL = __DEV__
        ? 'http://10.0.2.2:5000'  // Android emulator default - change for your setup
        : 'wss://your-production-server.com';

      console.log('🔌 Connecting to Socket.IO server:', SERVER_URL);

      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        autoConnect: true,
        // Add authentication if needed
        // auth: {
        //   token: userToken
        // }
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected with ID:', this.socket?.id);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.setupChallengeEventHandlers();
        resolve(this.socket!);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        this.connected = false;

        if (reason === 'io server disconnect') {
          this.handleReconnection();
        }
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('🔌 Socket.IO connection error:', error);
        this.handleConnectionError(error);
        reject(error);
      });

      this.socket.on('reconnect', (attemptNumber: number) => {
        console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
        this.connected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', (error: any) => {
        console.error('🔄 Socket.IO reconnection failed:', error);
        this.handleConnectionError(error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('🔄 Socket.IO reconnection failed permanently');
      });
    });
  }

  private setupChallengeEventHandlers() {
    if (!this.socket) return;

    // Handle challenge updates
    this.socket.on('challenge_update', (data: any) => {
      console.log('📡 Challenge update received:', data);
      this.emitEvent('challenge_update', data);
    });

    // Handle leaderboard updates
    this.socket.on('leaderboard_update', (data: any) => {
      console.log('🏆 Leaderboard update received:', data);
      this.emitEvent('leaderboard_update', data);
    });

    // Handle notification updates
    this.socket.on('notification', (data: any) => {
      console.log('🔔 Notification received:', data);
      this.emitEvent('notification', data);
    });

    // Handle authentication response
    this.socket.on('authenticated', (data: any) => {
      console.log('🔐 Socket authenticated:', data);
      this.emitEvent('authenticated', data);
    });

    // Handle joined challenge room confirmation
    this.socket.on('joined_challenge', (data: any) => {
      console.log('🛒 Joined challenge room:', data);
      this.emitEvent('joined_challenge', data);
    });
  }

  private emitEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  private handleConnectionError(error: any) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.socket?.connect();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  private handleReconnection() {
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Manually reconnecting Socket.IO...');
      this.socket.connect();
    }
  }

  // Public API methods for challenge interactions

  authenticate(userId: string): void {
    if (this.socket?.connected) {
      console.log('🔐 Authenticating socket for user:', userId);
      this.socket.emit('authenticate', { userId });
    } else {
      console.warn('⚠️ Socket not connected, cannot authenticate');
    }
  }

  joinChallenge(challengeId: string): void {
    if (this.socket?.connected) {
      console.log('🛒 Joining challenge room:', challengeId);
      this.socket.emit('join_challenge', { challengeId });
    } else {
      console.warn('⚠️ Socket not connected, cannot join challenge');
    }
  }

  leaveChallenge(challengeId: string): void {
    if (this.socket?.connected) {
      console.log('🚶 Leaving challenge room:', challengeId);
      this.socket.emit('leave_challenge', { challengeId });
    } else {
      console.warn('⚠️ Socket not connected, cannot leave challenge');
    }
  }

  // Send tip notification to other participants
  notifyTip(challengeId: string, participantId: string, tipperId: string, amount: number): void {
    if (this.socket?.connected) {
      console.log('💰 Sending tip notification:', { challengeId, participantId, tipperId, amount });
      this.socket.emit('tip_sent', {
        challengeId,
        participantId,
        tipperId,
        amount
      });
    } else {
      console.warn('⚠️ Socket not connected, tip notification not sent');
    }
  }

  // Notify about new participant joining
  notifyParticipantJoined(challengeId: string, participantId: string): void {
    if (this.socket?.connected) {
      console.log('👋 Sending participant joined notification:', { challengeId, participantId });
      this.socket.emit('participant_joined', {
        challengeId,
        participantId
      });
    } else {
      console.warn('⚠️ Socket not connected, participant notification not sent');
    }
  }

  // Request leaderboard update
  requestLeaderboard(challengeId: string): void {
    if (this.socket?.connected) {
      console.log('🏆 Requesting leaderboard update:', challengeId);
      this.socket.emit('request_leaderboard', { challengeId });
    } else {
      console.warn('⚠️ Socket not connected, cannot request leaderboard');
    }
  }

  // Generic event emitter
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      console.log('📤 Emitting event:', event, data);
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit event:', event);
    }
  }

  // Event listener registration
  on(event: string, callback: SocketEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remove event listener
  off(event: string, callback?: SocketEventCallback): void {
    if (!this.eventListeners.has(event)) return;

    const listeners = this.eventListeners.get(event)!;
    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      listeners.length = 0; // Remove all listeners
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.connected;
  }

  // Get connection stats
  getStats() {
    return {
      connected: this.connected,
      id: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Clean disconnect
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.eventListeners.clear();
    }
  }

  // Force cleanup
  destroy(): void {
    this.disconnect();
  }
}

// Export singleton instance
export const SharedSocketService = {
  getInstance: () => SocketService.getInstance(),
  connect: () => SocketService.getInstance().connect(),
  disconnect: () => SocketService.getInstance().disconnect(),
  destroy: () => SocketService.getInstance().destroy()
};

// Export class for advanced usage
export default SocketService;
