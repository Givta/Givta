import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export enum AchievementType {
  PARTICIPATION = 'participation',
  WINNING = 'winning',
  SOCIAL = 'social',
  CONSISTENCY = 'consistency',
  GENEROSITY = 'generosity',
  VIRALITY = 'virality'
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: BadgeRarity;
  icon: string;
  requirements: {
    challengeType?: string;
    minValue: number;
    timeFrame?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  };
  rewards: {
    xp: number;
    title?: string;
    specialEffect?: string;
  };
  unlockedAt?: Date;
  progress?: number;
}

export interface UserGamification {
  userId: string;
  level: number;
  xp: number;
  totalXp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;

  // Achievements & Badges
  achievements: Achievement[];
  unlockedTitles: string[];
  specialEffects: string[];

  // Challenge Statistics
  totalChallenges: number;
  totalWins: number;
  totalTipsGiven: number;
  totalTipsReceived: number;
  totalPrizeMoney: number;
  competitionChallenges: number; // Track competition-specific challenges
  consecutiveWins: number; // Track consecutive wins for undefeated achievement

  // Social Stats
  friendsInvited: number;
  challengesShared: number;
  viralShares: number; // Challenges that got >100 participants

  // Elite Status
  eliteStatus: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'none';
  reputationScore: number;
  title: string;

  updatedAt: Date;
}

export interface GamificationEvent {
  userId: string;
  type: 'tip_given' | 'tip_received' | 'challenge_joined' | 'challenge_won' | 'rank_improved' | 'streak_maintained';
  challengeId?: string;
  value: number;
  timestamp: Date;
  xpEarned: number;
}

export class GamificationService {
  private static collectionName = 'userGamification';
  private static eventsCollection = 'gamificationEvents';

  // ===== XP & LEVELING SYSTEM =====

  private static XP_LEVELS = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, // Levels 1-10
    4000, 5000, 6200, 7600, 9200, 11000, 15000, 15200, 17600, 20200, // 11-20
    // Higher levels scale exponentially
    25000, 35000, 50000, 75000, 110000, 160000, 250000, 350000, 470000, 670000 // 21-30
  ];

  static calculateLevel(xp: number): { level: number; xpForNextLevel: number; progressPercent: number } {
    let level = 1;
    for (let i = 0; i < this.XP_LEVELS.length - 1; i++) {
      if (xp >= this.XP_LEVELS[i + 1]) {
        level = i + 2;
      } else {
        break;
      }
    }

    const currentLevelXp = this.XP_LEVELS[level - 1] || 0;
    const nextLevelXp = this.XP_LEVELS[level] || (currentLevelXp + 100000);
    const xpToNextLevel = nextLevelXp - xp;
    const progressPercent = level === 1
      ? (xp / nextLevelXp) * 100
      : ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

    return { level, xpForNextLevel: xpToNextLevel, progressPercent };
  }

  // ===== ACHIEVEMENT SYSTEM =====

  private static ACHIEVEMENTS: Achievement[] = [
    // Participation Achievements
    {
      id: 'first_challenge',
      name: 'First Steps',
      description: 'Join your first challenge',
      type: AchievementType.PARTICIPATION,
      rarity: BadgeRarity.COMMON,
      icon: '🎯',
      requirements: { minValue: 1 },
      rewards: { xp: 50, title: 'Challenger' }
    },
    {
      id: 'challenge_enthusiast',
      name: 'Challenge Enthusiast',
      description: 'Join 10 different challenges',
      type: AchievementType.PARTICIPATION,
      rarity: BadgeRarity.COMMON,
      icon: '🔥',
      requirements: { minValue: 10 },
      rewards: { xp: 200 }
    },
    {
      id: 'competition_master',
      name: 'Competition Master',
      description: 'Participate in 5 competitive challenges',
      type: AchievementType.PARTICIPATION,
      rarity: BadgeRarity.RARE,
      icon: '🏆',
      requirements: { challengeType: 'competition', minValue: 5 },
      rewards: { xp: 500 }
    },

    // Winning Achievements
    {
      id: 'first_win',
      name: 'Triumphant Debut',
      description: 'Win your first challenge',
      type: AchievementType.WINNING,
      rarity: BadgeRarity.RARE,
      icon: '👑',
      requirements: { minValue: 1 },
      rewards: { xp: 300, title: 'Winner' }
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Win 10 challenges',
      type: AchievementType.WINNING,
      rarity: BadgeRarity.EPIC,
      icon: '🛡️',
      requirements: { minValue: 10 },
      rewards: { xp: 1000, specialEffect: 'golden_crown' }
    },
    {
      id: 'undefeated',
      name: 'Undefeated',
      description: 'Win 5 challenges in a row',
      type: AchievementType.WINNING,
      rarity: BadgeRarity.LEGENDARY,
      icon: '⚡',
      requirements: { minValue: 5, timeFrame: 'allTime' },
      rewards: { xp: 2000, title: 'Invincible' }
    },

    // Social Achievements
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Invite 5 friends to challenges',
      type: AchievementType.SOCIAL,
      rarity: BadgeRarity.COMMON,
      icon: '🦋',
      requirements: { minValue: 5 },
      rewards: { xp: 150 }
    },
    {
      id: 'influencer',
      name: 'Challenge Influencer',
      description: 'Share challenges that get 50+ participants',
      type: AchievementType.SOCIAL,
      rarity: BadgeRarity.EPIC,
      icon: '📢',
      requirements: { minValue: 50 },
      rewards: { xp: 800, specialEffect: 'viral_aura' }
    },

    // Consistency Achievements
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintain a 7-day participation streak',
      type: AchievementType.CONSISTENCY,
      rarity: BadgeRarity.RARE,
      icon: '🔥',
      requirements: { minValue: 7, timeFrame: 'weekly' },
      rewards: { xp: 500, title: 'Consistent' }
    },
    {
      id: 'iron_man',
      name: 'Iron Man',
      description: 'Maintain a 30-day participation streak',
      type: AchievementType.CONSISTENCY,
      rarity: BadgeRarity.LEGENDARY,
      icon: '💪',
      requirements: { minValue: 30, timeFrame: 'monthly' },
      rewards: { xp: 2500, title: 'Iron Will' }
    },

    // Generosity Achievements
    {
      id: 'generous_soul',
      name: 'Generous Soul',
      description: 'Give tips totaling ₦10,000',
      type: AchievementType.GENEROSITY,
      rarity: BadgeRarity.RARE,
      icon: '💝',
      requirements: { minValue: 10000 },
      rewards: { xp: 600, title: 'Philanthropist' }
    },
    {
      id: 'millionaire_tipper',
      name: 'Millionaire Tipper',
      description: 'Give tips totaling ₦100,000',
      type: AchievementType.GENEROSITY,
      rarity: BadgeRarity.LEGENDARY,
      icon: '💎',
      requirements: { minValue: 100000 },
      rewards: { xp: 5000, specialEffect: 'diamond_rain' }
    }
  ];

  // ===== ELITE STATUS SYSTEM =====

  private static ELITE_THRESHOLDS = {
    bronze: { xp: 1000, wins: 3, reputation: 100 },
    silver: { xp: 5000, wins: 10, reputation: 500 },
    gold: { xp: 15000, wins: 25, reputation: 1000 },
    platinum: { xp: 50000, wins: 50, reputation: 2000 },
    diamond: { xp: 75000, wins: 100, reputation: 5000 }
  };

  static calculateEliteStatus(gamification: UserGamification): string {
    const { xp, totalWins, reputationScore } = gamification;

    if (xp >= this.ELITE_THRESHOLDS.diamond.xp &&
        totalWins >= this.ELITE_THRESHOLDS.diamond.wins &&
        reputationScore >= this.ELITE_THRESHOLDS.diamond.reputation) {
      return 'diamond';
    }
    if (xp >= this.ELITE_THRESHOLDS.platinum.xp &&
        totalWins >= this.ELITE_THRESHOLDS.platinum.wins &&
        reputationScore >= this.ELITE_THRESHOLDS.platinum.reputation) {
      return 'platinum';
    }
    if (xp >= this.ELITE_THRESHOLDS.gold.xp &&
        totalWins >= this.ELITE_THRESHOLDS.gold.wins &&
        reputationScore >= this.ELITE_THRESHOLDS.gold.reputation) {
      return 'gold';
    }
    if (xp >= this.ELITE_THRESHOLDS.silver.xp &&
        totalWins >= this.ELITE_THRESHOLDS.silver.wins &&
        reputationScore >= this.ELITE_THRESHOLDS.silver.reputation) {
      return 'silver';
    }
    if (xp >= this.ELITE_THRESHOLDS.bronze.xp &&
        totalWins >= this.ELITE_THRESHOLDS.bronze.wins &&
        reputationScore >= this.ELITE_THRESHOLDS.bronze.reputation) {
      return 'bronze';
    }

    return 'none';
  }

  // ===== MAIN GAMIFICATION METHODS =====

  static async getUserGamification(userId: string): Promise<UserGamification | null> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        const { level, xpForNextLevel, progressPercent } = this.calculateLevel(data.xp);

        return {
          ...data,
          level,
          xpToNextLevel: xpForNextLevel,
          lastActivityDate: data.lastActivityDate instanceof Timestamp ? data.lastActivityDate.toDate() : data.lastActivityDate,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        };
      }

      // Create initial gamification profile
      return this.initializeUserGamification(userId);
    } catch (error) {
      console.error('Error getting user gamification:', error);
      return null;
    }
  }

  static async initializeUserGamification(userId: string): Promise<UserGamification> {
    const initialGamification: UserGamification = {
      userId,
      level: 1,
      xp: 0,
      totalXp: 0,
      xpToNextLevel: 100,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),

      achievements: [],
      unlockedTitles: ['Challenger'],
      specialEffects: [],

      totalChallenges: 0,
      totalWins: 0,
      totalTipsGiven: 0,
      totalTipsReceived: 0,
      totalPrizeMoney: 0,
      competitionChallenges: 0,
      consecutiveWins: 0,

      friendsInvited: 0,
      challengesShared: 0,
      viralShares: 0,

      eliteStatus: 'none',
      reputationScore: 0,
      title: 'Challenger',

      updatedAt: new Date()
    };

    await this.saveUserGamification(initialGamification);
    return initialGamification;
  }

  static async saveUserGamification(gamification: UserGamification): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, gamification.userId);

      // Calculate elite status
      gamification.eliteStatus = this.calculateEliteStatus(gamification) as any;

      // Choose best title
      gamification.title = this.selectBestTitle(gamification.unlockedTitles);

      await setDoc(docRef, {
        ...gamification,
        lastActivityDate: Timestamp.fromDate(gamification.lastActivityDate),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error saving user gamification:', error);
      throw error;
    }
  }

  private static selectBestTitle(titles: string[]): string {
    const titlePriority = {
      'Invincible': 100,
      'Champion': 90,
      'Iron Will': 85,
      'Philanthropist': 80,
      'Winner': 70,
      'Consistent': 60,
      'Influencer': 50,
      'Challenger': 10
    };

    let bestTitle = 'Challenger';
    let highestPriority = 0;

    for (const title of titles) {
      const priority = titlePriority[title as keyof typeof titlePriority] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        bestTitle = title;
      }
    }

    return bestTitle;
  }

  // ===== EVENT PROCESSING =====

  static async processGamificationEvent(
    userId: string,
    event: Omit<GamificationEvent, 'userId' | 'timestamp'>
  ): Promise<{ xpEarned: number; levelUp: boolean; newAchievements: Achievement[] }> {
    try {
      let gamification = await this.getUserGamification(userId);
      if (!gamification) {
        await this.initializeUserGamification(userId);
        gamification = await this.getUserGamification(userId);
      }

      if (!gamification) throw new Error('Failed to load gamification data');

      const result = {
        xpEarned: 0,
        levelUp: false,
        newAchievements: [] as Achievement[]
      };

      // Update streak
      const today = new Date().toDateString();
      const lastActivity = gamification.lastActivityDate.toDateString();

      if (today !== lastActivity) {
        if (today === new Date(gamification.lastActivityDate.getTime() + 24 * 60 * 60 * 1000).toDateString()) {
          // Consecutive day
          gamification.currentStreak++;
          if (gamification.currentStreak > gamification.longestStreak) {
            gamification.longestStreak = gamification.currentStreak;
          }
        } else {
          // Reset streak
          gamification.currentStreak = 1;
        }
        gamification.lastActivityDate = new Date();
      }

      // Add XP based on event type
      let baseXp = 0;
      switch (event.type) {
        case 'tip_given':
          baseXp = Math.floor(event.value / 10); // ₦50 = 5 XP
          gamification.totalTipsGiven += event.value;
          break;
        case 'tip_received':
          baseXp = Math.floor(event.value / 20); // ₦50 = 2.5 XP
          gamification.totalTipsReceived += event.value;
          break;
        case 'challenge_joined':
          baseXp = 25;
          gamification.totalChallenges++;
          break;
        case 'challenge_won':
          baseXp = 200;
          gamification.totalWins++;
          gamification.consecutiveWins++; // Track consecutive wins
          break;
        case 'rank_improved':
          baseXp = 50;
          break;
        case 'streak_maintained':
          baseXp = 15;
          break;
      }

      // Apply streak bonus
      baseXp = Math.floor(baseXp * (1 + gamification.currentStreak * 0.1)); // 10% bonus per streak day

      // Apply elite status bonus
      const eliteBonuses = { bronze: 1.1, silver: 1.2, gold: 1.3, platinum: 1.4, diamond: 1.5 };
      const eliteMultiplier = eliteBonuses[gamification.eliteStatus as keyof typeof eliteBonuses] || 1;
      baseXp = Math.floor(baseXp * eliteMultiplier);

      result.xpEarned = baseXp;

      // Update XP and check for level up
      const oldLevel = gamification.level;
      gamification.xp += baseXp;
      gamification.totalXp += baseXp;

      const levelInfo = this.calculateLevel(gamification.xp);
      gamification.level = levelInfo.level;
      gamification.xpToNextLevel = levelInfo.xpForNextLevel;

      if (gamification.level > oldLevel) {
        result.levelUp = true;
      }

      // Check for new achievements
      result.newAchievements = await this.checkAndUnlockAchievements(gamification, event);

      // Update reputation score
      gamification.reputationScore = this.calculateReputation(gamification);

      // Save updated data
      await this.saveUserGamification(gamification);

      // Log the event
      await this.logEvent({
        userId,
        ...event,
        timestamp: new Date(),
        xpEarned: baseXp
      });

      return result;

    } catch (error) {
      console.error('Error processing gamification event:', error);
      throw error;
    }
  }

  private static calculateReputation(gamification: UserGamification): number {
    const { totalWins, totalChallenges, reputationScore } = gamification;
    const winRate = totalWins / Math.max(totalChallenges, 1);
    return Math.floor(reputationScore + (winRate * 100) + (gamification.longestStreak * 10));
  }

  private static async checkAndUnlockAchievements(
    gamification: UserGamification,
    event: Omit<GamificationEvent, 'userId' | 'timestamp'>
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const achievement of this.ACHIEVEMENTS) {
      if (gamification.achievements.find(a => a.id === achievement.id)) continue;

      let unlocked = false;

      switch (achievement.id) {
        case 'first_challenge':
          unlocked = gamification.totalChallenges >= 1;
          break;
        case 'challenge_enthusiast':
          unlocked = gamification.totalChallenges >= 10;
          break;
        case 'competition_master':
          unlocked = gamification.competitionChallenges >= 5;
          break;
        case 'first_win':
          unlocked = gamification.totalWins >= 1;
          break;
        case 'champion':
          unlocked = gamification.totalWins >= 10;
          break;
        case 'undefeated':
          unlocked = gamification.consecutiveWins >= 5; // 5 wins in a row
          break;
        case 'streak_master':
          unlocked = gamification.currentStreak >= 7;
          break;
        case 'iron_man':
          unlocked = gamification.longestStreak >= 30;
          break;
        case 'social_butterfly':
          unlocked = gamification.friendsInvited >= 5;
          break;
        case 'influencer':
          unlocked = gamification.viralShares >= 50 || gamification.challengesShared >= 50;
          break;
        case 'generous_soul':
          unlocked = gamification.totalTipsGiven >= 10000;
          break;
        case 'millionaire_tipper':
          unlocked = gamification.totalTipsGiven >= 100000;
          break;
      }

      if (unlocked) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date()
        };

        gamification.achievements.push(unlockedAchievement);
        gamification.xp += achievement.rewards.xp;

        if (achievement.rewards.title) {
          gamification.unlockedTitles.push(achievement.rewards.title);
        }

        if (achievement.rewards.specialEffect) {
          gamification.specialEffects.push(achievement.rewards.specialEffect);
        }

        newAchievements.push(unlockedAchievement);
      }
    }

    return newAchievements;
  }

  // ===== EVENT LOGGING =====

  private static async logEvent(event: GamificationEvent): Promise<void> {
    try {
      await addDoc(collection(db, this.eventsCollection), {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp)
      });
    } catch (error) {
      console.error('Error logging gamification event:', error);
    }
  }

  // ===== LEADERBOARDS =====

  static async getGlobalLeaderboard(maxLimit = 50): Promise<UserGamification[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('xp', 'desc'),
        limit(maxLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          lastActivityDate: data.lastActivityDate instanceof Timestamp ? data.lastActivityDate.toDate() : data.lastActivityDate,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        };
      });
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      return [];
    }
  }

  // ===== VIRAL SHARING ACHIEVEMENT CHECKING =====

  static async checkViralAchievement(userId: string, participantCount: number): Promise<Achievement[]> {
    try {
      let gamification = await this.getUserGamification(userId);
      if (!gamification) return [];

      const userHasEnoughShares = gamification.viralShares >= 50 || gamification.challengesShared >= 50;

      if (userHasEnoughShares && participantCount >= 50) {
        // Award influencer achievement if they haven't unlocked it yet
        const influencerAchievement = this.ACHIEVEMENTS.find(a => a.id === 'influencer');
        if (influencerAchievement && !gamification.achievements.find(a => a.id === 'influencer')) {
          const unlockedAchievement = {
            ...influencerAchievement,
            unlockedAt: new Date()
          };

          gamification.achievements.push(unlockedAchievement);
          gamification.xp += influencerAchievement.rewards.xp;

          if (influencerAchievement.rewards.title) {
            gamification.unlockedTitles.push(influencerAchievement.rewards.title);
          }

          if (influencerAchievement.rewards.specialEffect) {
            gamification.specialEffects.push(influencerAchievement.rewards.specialEffect);
          }

          await this.saveUserGamification(gamification);
          return [unlockedAchievement];
        }
      }

      return [];
    } catch (error) {
      console.error('Error checking viral achievement:', error);
      return [];
    }
  }

  // ===== CHALLENGE PARTICIPATION TRACKING =====

  static async updateCompetitionChallengeCount(userId: string): Promise<void> {
    try {
      const gamification = await this.getUserGamification(userId);
      if (gamification) {
        gamification.competitionChallenges++;
        await this.saveUserGamification(gamification);
      }
    } catch (error) {
      console.error('Error updating competition challenge count:', error);
    }
  }

  // ===== RESET CONSECUTIVE WINS =====

  static async resetConsecutiveWins(userId: string): Promise<void> {
    try {
      const gamification = await this.getUserGamification(userId);
      if (gamification && gamification.consecutiveWins > 0) {
        gamification.consecutiveWins = 0;
        await this.saveUserGamification(gamification);
      }
    } catch (error) {
      console.error('Error resetting consecutive wins:', error);
    }
  }

  // ===== REWARDS SYSTEM =====

  static async claimDailyReward(userId: string): Promise<{ claimed: boolean; reward?: { xp: number; bonus: any } }> {
    try {
      const gamification = await this.getUserGamification(userId);
      if (!gamification) return { claimed: false };

      const today = new Date().toDateString();
      const lastActivity = gamification.lastActivityDate.toDateString();

      if (today === lastActivity) {
        return { claimed: false, reward: undefined }; // Already claimed today
      }

      // Calculate daily reward based on streak
      const baseXp = 10;
      const streakBonus = Math.min(gamification.currentStreak * 2, 20);
      const totalXp = baseXp + streakBonus;

      // Process as gamification event
      await this.processGamificationEvent(userId, {
        type: 'streak_maintained',
        value: gamification.currentStreak,
        xpEarned: totalXp
      });

      return {
        claimed: true,
        reward: {
          xp: totalXp,
          bonus: streakBonus > 0 ? `${streakBonus} streak bonus` : undefined
        }
      };

    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return { claimed: false };
    }
  }
}

// ===== HOOK FOR REACT COMPONENTS =====

import { useState, useEffect, useCallback } from 'react';

export function useGamification(userId: string) {
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await GamificationService.getUserGamification(userId);
      setGamification(data);
    } catch (error) {
      console.error('Error loading gamification:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  const updateStats = useCallback(async (event: Omit<GamificationEvent, 'userId' | 'timestamp'>) => {
    const result = await GamificationService.processGamificationEvent(userId, event);
    await refresh(); // Refresh data after update
    return result;
  }, [userId, refresh]);

  const claimDailyReward = useCallback(async () => {
    const result = await GamificationService.claimDailyReward(userId);
    if (result.claimed) {
      await refresh();
    }
    return result;
  }, [userId, refresh]);

  return {
    gamification,
    loading,
    refresh,
    updateStats,
    claimDailyReward
  };
}
