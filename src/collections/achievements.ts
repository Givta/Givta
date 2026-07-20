import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export type AchievementType = 'streak' | 'milestone' | 'rank_achievement' | 'completion';

export interface Achievement {
  id?: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt?: Timestamp;
  progress?: number;
  target?: number;
  isActive: boolean;
  metadata?: {
    challengeId?: string;
    rankAchieved?: number;
    previousStreak?: number;
  };
}

// Collection names
const COLLECTIONS = {
  ACHIEVEMENTS: 'achievements_v2',
  USER_STATS: 'user_stats_v2',
  RANKING_RULES: 'ranking_rules_v2'
};

export class AchievementsCollection {
  private static collectionName = COLLECTIONS.ACHIEVEMENTS;

  // Create a new achievement
  static async create(achievementData: Omit<Achievement, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...achievementData,
        earnedAt: Timestamp.now(),
        isActive: true,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  }

  // Get achievement by ID
  static async getById(id: string): Promise<Achievement | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id,
          ...docSnap.data(),
        } as Achievement;
      }
      return null;
    } catch (error) {
      console.error('Error getting achievement:', error);
      throw error;
    }
  }

  // Get user achievements
  static async getByUserId(userId: string, limitCount: number = 50): Promise<Achievement[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('earnedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Achievement));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  // Update achievement
  static async update(id: string, updates: Partial<Achievement>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  }

  // Soft delete achievement
  static async delete(id: string): Promise<void> {
    try {
      await this.update(id, { isActive: false });
    } catch (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  }
}

// User Stats Collection for more detailed tracking
export interface UserStats {
  id?: string;
  userId: string;
  weeklyStats: {
    currentTipperRank: number;
    currentTippedRank: number;
    bestTipperRank: number;
    bestTippedRank: number;
    bonusesThisWeek: number;
    tipsGivenThisWeek: number;
    tipsReceivedThisWeek: number;
    lastUpdated: Timestamp;
  };
  streaks: {
    currentTipStreak: number;
    longestTipStreak: number;
    lastTipDate?: Timestamp;
  };
  achievements: {
    totalEarned: number;
    recentAchievements: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class UserStatsCollection {
  private static collectionName = COLLECTIONS.USER_STATS;

  // Create or update user stats
  static async createOrUpdate(statsData: Omit<UserStats, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();

      // Check if stats already exist
      const existingStats = await this.getByUserId(statsData.userId);
      if (existingStats) {
        await this.update(existingStats.id!, {
          ...statsData,
          updatedAt: now
        });
        return existingStats.id!;
      }

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...statsData,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating/updating user stats:', error);
      throw error;
    }
  }

  // Get user stats by user ID
  static async getByUserId(userId: string): Promise<UserStats | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as UserStats;
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Update user stats
  static async update(id: string, updates: Partial<UserStats>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

// Ranking Rules Collection for system rules
export interface RankingRules {
  id?: string;
  weekStartDay: number; // 1-7 (Monday-Sunday)
  bonusStructure: {
    rank1: number; // 5% bonus
    rank2: number; // 3% bonus
    rank3: number; // 1% bonus
  };
  penalties: {
    inactivateAfterDays: number; // Deactivate ranking after X days inactive
    minimumTipsForRanking: number; // Minimum tips to appear in rankings
  };
  achievements: {
    streakDefinitions: Array<{
      days: number;
      title: string;
      description: string;
    }>;
    rankDefinitions: Array<{
      rank: number;
      title: string;
      description: string;
    }>;
  };
  lastUpdated: Timestamp;
  updatedBy: string;
}

export class RankingRulesCollection {
  private static collectionName = COLLECTIONS.RANKING_RULES;
  private static defaultRulesId = 'default_rules';

  // Get current ranking rules
  static async getCurrentRules(): Promise<RankingRules> {
    try {
      const docRef = doc(db, this.collectionName, this.defaultRulesId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as RankingRules;
      }

      // Return default rules if none exist
      return this.getDefaultRules();
    } catch (error) {
      console.error('Error getting ranking rules:', error);
      return this.getDefaultRules();
    }
  }

  // Get default ranking rules
  private static getDefaultRules(): RankingRules {
    return {
      id: this.defaultRulesId,
      weekStartDay: 1, // Monday
      bonusStructure: {
        rank1: 5, // 5% bonus for 1st place
        rank2: 3, // 3% bonus for 2nd place
        rank3: 1  // 1% bonus for 3rd place
      },
      penalties: {
        inactivateAfterDays: 30, // Deactivate after 30 days inactive
        minimumTipsForRanking: 5 // Need at least 5 tips to rank
      },
      achievements: {
        streakDefinitions: [
          { days: 7, title: 'Week Warrior', description: 'Tipped for 7 consecutive days' },
          { days: 14, title: 'Fortnite Fighter', description: 'Tipped for 14 consecutive days' },
          { days: 30, title: 'Elite Contributor', description: 'Tipped for 30 consecutive days' },
          { days: 60, title: 'Legend Titan', description: 'Tipped for 60 consecutive days' },
          { days: 100, title: 'Diamond Dynamo', description: 'Tipped for 100 consecutive days' }
        ],
        rankDefinitions: [
          { rank: 10, title: 'Top 10 Champion', description: 'Reached top 10 weekly rankings' },
          { rank: 5, title: 'Top 5 Elite', description: 'Reached top 5 weekly rankings' },
          { rank: 3, title: 'Podium King', description: 'Reached top 3 weekly rankings' },
          { rank: 1, title: 'Weekly Champion', description: 'Achieved 1st place weekly!' }
        ]
      },
      lastUpdated: Timestamp.now(),
      updatedBy: 'system'
    };
  }

  // Update ranking rules
  static async updateRules(updates: Partial<RankingRules>, updatedBy: string): Promise<void> {
    try {
      const currentRules = await this.getCurrentRules();
      const docRef = doc(db, this.collectionName, this.defaultRulesId);

      await setDoc(docRef, {
        ...currentRules,
        ...updates,
        lastUpdated: Timestamp.now(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Error updating ranking rules:', error);
      throw error;
    }
  }

  // Initialize default rules if they don't exist
  static async initializeDefaultRules(): Promise<void> {
    try {
      const existingRules = await this.getCurrentRules();
      if (!existingRules.id || existingRules.id === 'default_rules') {
        const defaultRules = this.getDefaultRules();
        await this.updateRules(defaultRules, 'system');
        console.log('Default ranking rules initialized successfully!');
      }
    } catch (error) {
      console.error('Error initializing default rules:', error);
      throw error;
    }
  }
}

// Achievement Helper Functions
export class AchievementHelper {
  // Check and award streak achievements
  static async checkStreakAchievements(userId: string, currentStreak: number): Promise<void> {
    try {
      const rules = await RankingRulesCollection.getCurrentRules();

      for (const streak of rules.achievements.streakDefinitions) {
        if (currentStreak === streak.days) {
          await AchievementsCollection.create({
            userId,
            type: 'streak',
            title: streak.title,
            description: streak.description,
            icon: '🔥',
            progress: currentStreak,
            target: streak.days,
            isActive: true,
            metadata: { previousStreak: currentStreak }
          });
        }
      }
    } catch (error) {
      console.error('Error checking streak achievements:', error);
    }
  }

  // Check and award rank achievements
  static async checkRankAchievements(userId: string, rank: number, tipperRank: number): Promise<void> {
    try {
      const rules = await RankingRulesCollection.getCurrentRules();
      const bestRank = Math.min(rank, tipperRank);

      for (const rankDef of rules.achievements.rankDefinitions) {
        if (bestRank <= rankDef.rank) {
          // Check if user already earned this
          const existing = await AchievementsCollection.getByUserId(userId);
          const alreadyEarned = existing.some(a =>
            a.type === 'rank_achievement' && a.metadata?.rankAchieved === rankDef.rank
          );

          if (!alreadyEarned) {
            await AchievementsCollection.create({
              userId,
              type: 'rank_achievement',
              title: rankDef.title,
              description: rankDef.description,
              icon: '🏆',
              progress: bestRank,
              target: rankDef.rank,
              isActive: true,
              metadata: { rankAchieved: rankDef.rank }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking rank achievements:', error);
    }
  }
}
