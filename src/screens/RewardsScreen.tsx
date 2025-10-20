import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { AchievementsCollection, UserStatsCollection, RankingRulesCollection } from '../collections/achievements';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { AchievementBadge } from '../components/AchievementBadge';

interface Achievement {
  id: string;
  type: 'streak' | 'milestone' | 'rank_achievement';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  progress?: number;
  target?: number;
}

interface UserProgressStats {
  weeklyRanking: number;
  bestWeeklyRank: number;
  totalWeeklyBonuses: number;
  currentStreak: number;
  longestStreak: number;
  totalTipsThisWeek: number;
  totalTippedAmountsThisWeek: number;
  achievementCount: number;
  rankClimbedThisWeek: number;
}

interface RewardItem {
  id: string;
  type: 'celebration_bonus' | 'competition_prize' | 'sponsor_prize' | 'weekly_top' | 'milestone_bonus';
  challengeId: string;
  challengeTitle: string;
  amount: number;
  status: 'earned' | 'claimed' | 'pending';
  earnedAt: Date;
  claimedAt?: Date;
  description: string;
}

interface WeeklyRanking {
  rank: number;
  username: string;
  userId: string;
  amount: number;
  displayName: string;
}

interface RankingsData {
  type: string;
  weekStart: string;
  rankings: WeeklyRanking[];
}

interface FirestoreTransaction {
  id: string;
  type: string;
  amount: number;
  netAmount?: number;
  senderId: string;
  recipientId: string;
  status: string;
  createdAt: any;
}

export const RewardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [weeklyTippers, setWeeklyTippers] = useState<WeeklyRanking[]>([]);
  const [weeklyTipped, setWeeklyTipped] = useState<WeeklyRanking[]>([]);
  const [showingAllRanks, setShowingAllRanks] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserProgressStats | null>(null);



  useEffect(() => {
    // Initial load
    loadRewards();
    // Add small delay to prevent overwhelming Firebase with concurrent queries
    setTimeout(() => loadWeeklyRankings(), 100);
    setTimeout(() => loadAchievements(), 200);
    setTimeout(() => loadUserStats(), 300);

    // ======= AUTO BACKGROUND REFRESH =======
    // Automatically refresh rankings every 30 seconds without affecting the UI
    const backgroundRefreshInterval = setInterval(() => {
      // Only refresh if:
      // - Not currently loading any data
      // - User exists (authenticated)
      if (!loading && user?.id) {
        console.log('🔄 Background auto-refresh: Updating rankings...');
        // Refresh rankings silently (no loading states)
        loadWeeklyRankings();
      }
    }, 50000); // 30 seconds

    // =========== CLEANUP ===========
    return () => {
      clearInterval(backgroundRefreshInterval);
      console.log('🧹 Auto-refresh cleanup: Background updates stopped');
    };
  }, []); // Empty dependency array - runs once on mount

  const loadRewards = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.log('No user ID, skipping rewards load');
        return;
      }

      console.log('🔍 Loading rewards for user:', user.id);

      // Simulate weekly bonus rewards (simplified without challenge logic)
      const now = new Date();
      const currentRank = weeklyTippers.find(r => r.userId === user?.id)?.rank || 0;

      let rewardsData: RewardItem[] = [];

      // Mock achievements-based bonuses for illustration
      if (currentRank >= 1 && currentRank <= 3) {
        rewardsData.push({
          id: `weekly-bonus-${now.getDate()}`,
          type: 'weekly_top',
          challengeId: 'weekly_challenge',
          challengeTitle: 'Weekly Rankings Bonus',
          amount: currentRank === 1 ? 500 : currentRank === 2 ? 300 : 200,
          status: 'earned',
          earnedAt: now,
          description: `Weekly #${currentRank} place bonus`
        });
      }

      setRewards(rewardsData);

      // Calculate totals
      setTotalEarned(rewardsData.reduce((sum, r) => sum + r.amount, 0));
      setTotalClaimed(
        rewardsData
          .filter(r => r.status === 'claimed')
          .reduce((sum, r) => sum + r.amount, 0)
      );

    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
};
  const loadWeeklyRankings = async () => {
    try {
      console.log('🔍 Starting rankings load...');
      console.log('👤 User authenticated:', !!user?.id, 'UserId:', user?.id);

      // SIMPLE AUTH TEST: Try to read a single document first to test auth
      console.log('🔐 Testing Firestore authentication...');

      try {
        const testQuery = await getDocs(query(collection(db, 'users'), limit(1)));
        console.log('✅ Auth test successful - can read users collection');
      } catch (authError: any) {
        console.error('❌ Auth test failed:', authError.message);

        // If auth fails, provide clear instructions
        console.log('🔄 Auth issue - try refreshing the app or logging out/in again');
        throw new Error('Authentication expired. Please logout and login again.');
      }

      // TEST: Log what permissions we should have according to rules
      console.log('🎯 Querying transactions collection');

      // Simplified query - remove date filtering to test basic permissions
      const testTransactionsQuery = await getDocs(query(
        collection(db, 'transactions'),
        limit(5) // Just get first 5 to test
      ));

      console.log('📊 Raw transactions found:', testTransactionsQuery.docs.length);

      // Calculate this week's date range (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      weekStart.setHours(0, 0, 0, 0);

      console.log('📅 Week start:', weekStart.toISOString());

      // Query transactions for tippers (tip_sent)
      console.log('🔍 Querying tip_sent transactions...');
      const tippersQuery = query(
        collection(db, 'transactions'),
        where('type', '==', 'tip_sent'),
        where('status', '==', 'completed')
      );

      const tippersSnapshot = await getDocs(tippersQuery);
      console.log('💰 Tippers query results:', tippersSnapshot.docs.length);

      // Query transactions for tipped users (tip_received)
      console.log('🔍 Querying tip_received transactions...');
      const tippedQuery = query(
        collection(db, 'transactions'),
        where('type', '==', 'tip_received'),
        where('status', '==', 'completed')
      );

      const tippedSnapshot = await getDocs(tippedQuery);
      console.log('💸 Tipped query results:', tippedSnapshot.docs.length);

      // Filter transactions for current week
      const tippersTransactions: FirestoreTransaction[] = tippersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTransaction))
        .filter(tx => tx.createdAt && tx.createdAt >= weekStart);

      const tippedTransactions: FirestoreTransaction[] = tippedSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTransaction))
        .filter(tx => tx.createdAt && tx.createdAt >= weekStart);

      console.log('📊 This week - Tippers:', tippersTransactions.length, 'Tipped:', tippedTransactions.length);

      // Skip aggregation if no data
      if (tippersTransactions.length === 0 && tippedTransactions.length === 0) {
        console.log('⚠️ No transactions found this week - skipping aggregation');
        setWeeklyTippers([]);
        setWeeklyTipped([]);
        return;
      }

      // Aggregate amounts
      const tipperTotals: { [userId: string]: { userId: string; amount: number } } = {};
      const tippedTotals: { [userId: string]: { userId: string; amount: number } } = {};

      tippersTransactions.forEach(tx => {
        if (tx.senderId) {
          tipperTotals[tx.senderId] = tipperTotals[tx.senderId] || { userId: tx.senderId, amount: 0 };
          tipperTotals[tx.senderId].amount += tx.amount || 0;
        }
      });

      tippedTransactions.forEach(tx => {
        if (tx.recipientId) {
          tippedTotals[tx.recipientId] = tippedTotals[tx.recipientId] || { userId: tx.recipientId, amount: 0 };
          tippedTotals[tx.recipientId].amount += tx.netAmount || tx.amount || 0;
        }
      });

      console.log('📈 Totals - Tippers:', Object.keys(tipperTotals).length, 'Tipped:', Object.keys(tippedTotals).length);

      // Convert to rankings arrays
      const tippersArray = Object.values(tipperTotals)
        .sort((a, b) => b.amount - a.amount)
        .map((item, index) => ({
          rank: index + 1,
          userId: item.userId,
          username: `User-${item.userId.slice(-4)}`, // Simplified username
          amount: item.amount,
          displayName: `User-${item.userId.slice(-4)}`
        }));

      const tippedArray = Object.values(tippedTotals)
        .sort((a, b) => b.amount - a.amount)
        .map((item, index) => ({
          rank: index + 1,
          userId: item.userId,
          username: `Creator-${item.userId.slice(-4)}`,
          amount: item.amount,
          displayName: `Creator-${item.userId.slice(-4)}`
        }));

      console.log('✅ Rankings calculated successfully');
      console.log('   Tippers:', tippersArray.length, 'rankings');
      console.log('   Tipped:', tippedArray.length, 'rankings');

      setWeeklyTippers(tippersArray);
      setWeeklyTipped(tippedArray);

    } catch (error: any) {
      console.error('❌ Failed to load rankings from Firestore:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);

      // Use mock data as fallback
      console.log('🔄 Using mock data fallback');
      const mockTippers: WeeklyRanking[] = [
        { rank: 1, userId: 'user_mock_1', username: 'topipper1', amount: 15000, displayName: 'topipper1' },
        { rank: 2, userId: 'user_mock_2', username: 'generous56', amount: 12000, displayName: 'generous56' },
        { rank: 3, userId: 'user_mock_3', username: 'tipmaster', amount: 10000, displayName: 'tipmaster' },
      ];
      const mockTipped: WeeklyRanking[] = [
        { rank: 1, userId: 'user_mock_tipped1', username: 'contentcreator1', amount: 20000, displayName: 'contentcreator1' },
        { rank: 2, userId: 'user_mock_tipped2', username: 'artist89', amount: 18500, displayName: 'artist89' },
        { rank: 3, userId: 'user_mock_tipped3', username: 'musician_pro', amount: 16200, displayName: 'musician_pro' },
      ];
      setWeeklyTippers(mockTippers);
      setWeeklyTipped(mockTipped);
    }
  };

  const loadAchievements = async () => {
    try {
      // Simulate achievements based on user activity
      const mockAchievements: Achievement[] = [
        {
          id: 'first-tip',
          type: 'milestone',
          title: 'First Steps',
          description: 'Made your first tip',
          icon: '🎯',
          earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          progress: 1,
          target: 1
        },
        {
          id: 'tip-master',
          type: 'milestone',
          title: 'Tip Master',
          description: 'Sent tips totaling ₦50,000',
          icon: '👑',
          earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          progress: 50000,
          target: 50000
        },
        {
          id: 'weekly-streak',
          type: 'streak',
          title: 'Consistent Giver',
          description: 'Tipped every day for a week',
          icon: '🔥',
          earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          progress: 7,
          target: 7
        },
        {
          id: 'rank-10',
          type: 'rank_achievement',
          title: 'Top 10 Champion',
          description: 'Reached top 10 in weekly rankings',
          icon: '⭐',
          earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          progress: 10,
          target: 10
        }
      ];

      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Simulate user progress stats
      const userTipperRank = weeklyTippers.find(r => r.userId === user?.id);
      const userTippedRank = weeklyTipped.find(r => r.userId === user?.id);

      const mockStats: UserProgressStats = {
        weeklyRanking: userTipperRank?.rank || 0,
        bestWeeklyRank: 5, // Mock data
        totalWeeklyBonuses: totalEarned,
        currentStreak: 3, // Mock daily tipping streak
        longestStreak: 12,
        totalTipsThisWeek: 15, // Mock tip count
        totalTippedAmountsThisWeek: userTipperRank?.amount || 0,
        achievementCount: achievements.length,
        rankClimbedThisWeek: 8 // Mock improvement from last week
      };

      setUserStats(mockStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const shareRanking = async () => {
    try {
      // Get the top 3 performers
      const top3Tippers = weeklyTippers.slice(0, 3).filter(r => r.amount > 0);
      const top3Tipped = weeklyTipped.slice(0, 3).filter(r => r.amount > 0);

      let message = `🏆 GIVTA CHALLENGE!\n\n`;
      message += `Givta is Africa's #1 social tipping platform! Show appreciation, support creators, and earn rewards while tipping loved ones, public figures, and content creators.\n\n`;
      message += `🎯 Can you displace these Top 3 Tippings this week?\n\n`;

      // Add current rankings challenge
      if (top3Tipped.length > 0) {
        message += `Most Tipped Users:\n`;
        message += `🥇 @${top3Tipped[0]?.username} ₦${formatCurrency(top3Tipped[0].amount).replace('₦', '')}\n`;

        if (top3Tipped.length > 1) {
          message += `🥈 @${top3Tipped[1]?.username} ₦${formatCurrency(top3Tipped[1].amount).replace('₦', '')}\n`;
        }
        if (top3Tipped.length > 2) {
          message += `🥉 @${top3Tipped[2]?.username} ₦${formatCurrency(top3Tipped[2].amount).replace('₦', '')}\n`;
        }
        message += '\n';
      }

      if (top3Tippers.length > 0) {
        message += `Biggest Tippers:\n`;
        message += `🥇 @${top3Tippers[0]?.username} ₦${formatCurrency(top3Tippers[0].amount).replace('₦', '')}\n`;

        if (top3Tippers.length > 1) {
          message += `🥈 @${top3Tippers[1]?.username} ₦${formatCurrency(top3Tippers[1].amount).replace('₦', '')}\n`;
        }
        if (top3Tippers.length > 2) {
          message += `🥉 @${top3Tippers[2]?.username} ₦${formatCurrency(top3Tippers[2].amount).replace('₦', '')}\n`;
        }
        message += '\n';
      }

      message += `💪 Think you can beat these rankings?\n`;
      message += `Join the Givta tipping revolution today!\n\n`;
      message += `� Download Givta: https://givta.ng\n`;
      message += `🌐 Web Version: https://givta.ng\n\n`;
      message += `#Givta #TippingCompetition #WeeklyChampions\n\n`;

      // Check if user has a ranking and highlight it
      const userRank = weeklyTippers.find(r => r.userId === user?.id);
      if (userRank) {
        message += `${userRank.rank <= 3 ? '🎉 ' : '💪'} I'm #${userRank.rank} this week!`;
      }

      // Use React Native's Share API (simple one-tap sharing)
      try {
        const { Share } = require('react-native');
        if (Share) {
          await Share.share({
            message: message,
            title: 'Givta Weekly Rankings Challenge!'
          });
        } else {
          // Fallback to clipboard
          try {
            const { Clipboard } = require('expo-clipboard');
            await Clipboard.setStringAsync(message);
            Alert.alert('✅ Ready to Share!', 'Challenge message copied to clipboard!');
          } catch (error) {
            Alert.alert('📋 Copy Ready', message, [{ text: 'OK' }]);
          }
        }
      } catch (error) {
        console.error('Share failed:', error);
        // Ultimate fallback - show copy dialog
        Alert.alert('📋 Copy to Share', message, [{ text: 'OK' }]);
      }

    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('❌ Error', 'Could not share rankings');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getRewardIcon = (type: RewardItem['type']) => {
    switch (type) {
      case 'celebration_bonus': return '🎂';
      case 'competition_prize': return '🏆';
      case 'sponsor_prize': return '⭐';
      case 'weekly_top': return '👑';
    }
  };

  const getRewardColor = (type: RewardItem['type']) => {
    switch (type) {
      case 'celebration_bonus': return '#FF6B6B';
      case 'competition_prize': return '#4ECDC4';
      case 'sponsor_prize': return '#45B7D1';
      case 'weekly_top': return '#FFD700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned': return '#34c759';
      case 'claimed': return '#007aff';
      case 'pending': return '#ff9500';
      default: return '#8e8e93';
    }
  };

  const renderRewardItem = ({ item }: { item: RewardItem }) => (
    <Card style={styles.rewardItem} padding={16}>
      <View style={styles.rewardHeader}>
        <View style={[styles.rewardIcon, { backgroundColor: getRewardColor(item.type) + '20' }]}>
          <Text style={styles.rewardEmoji}>{getRewardIcon(item.type)}</Text>
        </View>

        <View style={styles.rewardContent}>
          <Text style={styles.rewardTitle}>{item.challengeTitle}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
          <Text style={styles.rewardDate}>
            {item.status === 'claimed' ? 'Claimed' : 'Earned'} {formatDate(item.status === 'claimed' ? item.claimedAt! : item.earnedAt)}
          </Text>
        </View>

        <View style={styles.rewardAmount}>
          <Text style={styles.amountText}>+{formatCurrency(item.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderRankingItem = ({ item, isMyUser }: { item: WeeklyRanking, isMyUser: boolean }) => (
    <Card style={[styles.rankingItem, isMyUser && styles.myRankingItem]} padding={12}>
      <View style={styles.rankingRow}>
        <View style={styles.rankingLeft}>
          <Text style={[styles.rankingNumber, item.rank <= 3 && styles.topRank]}>{item.rank}</Text>
          <View style={styles.userIcon}>
            <Text style={styles.userEmoji}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, isMyUser && styles.myUsername]}>
              @{item.username}
            </Text>
            {item.displayName !== item.username && (
              <Text style={styles.displayName}>{item.displayName}</Text>
            )}
          </View>
        </View>
        <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
      </View>
    </Card>
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Get rankings to display (top 3 + user if not in top 3)
  const getRankingsToDisplay = (rankings: WeeklyRanking[], type: 'tippers' | 'tipped') => {
    const top3 = rankings.slice(0, 3);
    const userRanking = rankings.find(r => r.userId === user?.id);

    if (userRanking && userRanking.rank > 3) {
      // Add user ranking with a separator if not in top 3
      return {
        rankings: [...top3, userRanking],
        hasMore: rankings.length > 3,
        userPosition: {
          rank: userRanking.rank,
          amount: userRanking.amount,
          type
        }
      };
    }

    return {
      rankings: showingAllRanks ? rankings : top3,
      hasMore: rankings.length > 3,
      userPosition: userRanking && userRanking.rank <= 3 ? null : {
        rank: userRanking?.rank || 0,
        amount: userRanking?.amount || 0,
        type
      }
    };
  };

  // Calculate how much more user needs to reach 3rd place
  const getReachTop3Insight = (rankings: WeeklyRanking[], type: 'tippers' | 'tipped') => {
    const userRanking = rankings.find(r => r.userId === user?.id);
    const thirdPlace = rankings[2]; // 3rd place (index 2)

    if (!userRanking || !thirdPlace) return null;

    if (userRanking.rank <= 3) {
      return { message: `You're in ${type === 'tippers' ? 'top 3 tippers' : 'top 3 tipped users'}! 🎉` };
    }

    const difference = thirdPlace.amount - userRanking.amount;
    if (difference <= 0) return null; // They're already above 3rd place somehow

    return {
      message: `${type === 'tippers' ? 'Tip' : 'Get tipped'} ₦${formatCurrency(difference).replace('₦', '')} more to reach 3rd place!`,
      targetAmount: thirdPlace.amount,
      currentAmount: userRanking.amount,
      difference
    };
  };

  const tippersDisplay = getRankingsToDisplay(weeklyTippers, 'tippers');
  const tippedDisplay = getRankingsToDisplay(weeklyTipped, 'tipped');

  const tippersInsight = getReachTop3Insight(weeklyTippers, 'tippers');
  const tippedInsight = getReachTop3Insight(weeklyTipped, 'tipped');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>


      {/* Weekly Rankings */}
      <View style={styles.rankingsContainer}>
        <Card style={styles.rankingsCard} padding={16}>
      <View style={styles.rankingsHeader}>
        <Text style={styles.rankingHeader}>
          <Text style={{ fontSize: 24 }}>🏆</Text> Top Givta Stars of the Week
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareRanking}
        >
          <Ionicons name="share-social" size={20} color="#4B0082" />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

          {/* Top Tipped Users */}
          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>Most Tipped Users</Text>
            {tippedDisplay.rankings.length > 0 ? (
              <>
                {tippedInsight && (
                  <View style={styles.insightContainer}>
                    <Text style={styles.insightText}>{tippedInsight.message}</Text>
                  </View>
                )}
                {showingAllRanks ? (
                  // Show all rankings when expanded
                  tippedDisplay.rankings.map((ranking, index) => (
                    <View key={`tipped-${ranking.userId}`}>
                      {renderRankingItem({ item: ranking, isMyUser: ranking.userId === user?.id })}
                    </View>
                  ))
                ) : (
                  // Show top 3 + user position by default
                  <>
                    {tippedDisplay.rankings.slice(0, 3).map((ranking) => (
                      <View key={`tipped-top3-${ranking.userId}`}>
                        {renderRankingItem({ item: ranking, isMyUser: ranking.userId === user?.id })}
                      </View>
                    ))}
                    {tippedDisplay.rankings.length > 3 && (
                      <>
                        <View style={styles.divider}>
                          <Text style={styles.dividerText}>• • •</Text>
                          <Text style={styles.dividerLabel}>Your Position</Text>
                          <Text style={styles.dividerText}>• • •</Text>
                        </View>
                        {renderRankingItem({ item: tippedDisplay.rankings[tippedDisplay.rankings.length - 1], isMyUser: true })}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <Text style={styles.noDataText}>No data available this week</Text>
            )}
          </View>

          {/* Top Tippers */}
          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>Biggest Tippers</Text>
            {tippersDisplay.rankings.length > 0 ? (
              <>
                {tippersInsight && (
                  <View style={styles.insightContainer}>
                    <Text style={styles.insightText}>{tippersInsight.message}</Text>
                  </View>
                )}
                {showingAllRanks ? (
                  // Show all rankings when expanded
                  tippersDisplay.rankings.map((ranking, index) => (
                    <View key={`tipper-${ranking.userId}`}>
                      {renderRankingItem({ item: ranking, isMyUser: ranking.userId === user?.id })}
                    </View>
                  ))
                ) : (
                  // Show top 3 + user position by default
                  <>
                    {tippersDisplay.rankings.slice(0, 3).map((ranking) => (
                      <View key={`tipper-top3-${ranking.userId}`}>
                        {renderRankingItem({ item: ranking, isMyUser: ranking.userId === user?.id })}
                      </View>
                    ))}
                    {tippersDisplay.rankings.length > 3 && (
                      <>
                        <View style={styles.divider}>
                          <Text style={styles.dividerText}>• • •</Text>
                          <Text style={styles.dividerLabel}>Your Position</Text>
                          <Text style={styles.dividerText}>• • •</Text>
                        </View>
                        {renderRankingItem({ item: tippersDisplay.rankings[tippersDisplay.rankings.length - 1], isMyUser: true })}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <Text style={styles.noDataText}>No data available this week</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewFullRankingsButton}
            onPress={() => setShowingAllRanks(!showingAllRanks)}
          >
            <Text style={styles.viewFullText}>
              {showingAllRanks ? 'Collapse Rankings' : 'View Full Rankings'}
            </Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Rewards Summary */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard} padding={20}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalEarned)}</Text>
              <Text style={styles.summaryLabel}>Total Earned</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalClaimed)}</Text>
              <Text style={styles.summaryLabel}>Total Claimed</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Rewards List */}
      <Card style={styles.rewardsCard} padding={16} margin={16}>
        <Text style={styles.sectionTitle}>Reward History</Text>

        {rewards.length > 0 ? (
          <>
            <FlatList
              data={rewards}
              renderItem={renderRewardItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />

            {/* Achievement Badges Section */}
            <View style={styles.achievementsSection}>
              <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
              <Text style={styles.achievementsSubtitle}>Earned for your participation in Givta</Text>

              {/* Achievement badges will be shown here in the future */}
              <Text style={{ textAlign: 'center', color: '#8e8e93', fontSize: 14, marginTop: 16 }}>
                Coming soon! Earn badges for consistent tipping and engagement.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyRewards}>
            <Ionicons name="trophy-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>No rewards yet</Text>
            <Text style={styles.emptySubtext}>Complete challenges to earn bonuses and prizes!</Text>

            <View style={styles.achievementsPreview}>
              <Text style={styles.achievementsTitle}>🎖️ Unlock Achievements</Text>
              <Text style={styles.achievementsSubtitle}>Help creators reach their goals to earn badges</Text>

              <View style={styles.achievementsGrid}>
                <AchievementBadge
                  badge="first_contribution"
                  earnedAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                  size="small"
                  showDetails={false}
                />
                <AchievementBadge
                  badge="goal_helper"
                  earnedAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                  size="small"
                  showDetails={false}
                />
                <AchievementBadge
                  badge="goal_achiever"
                  earnedAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                  size="small"
                  showDetails={false}
                />
                <AchievementBadge
                  badge="goal_contributor"
                  earnedAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                  size="small"
                  showDetails={false}
                />
              </View>
            </View>


          </View>
        )}
      </Card>

      {/* Reward Types Info */}
      <Card style={styles.infoCard} padding={16} margin={16}>
        <Text style={styles.sectionTitle}>How Rewards Work</Text>

        <View style={styles.rewardTypes}>
          <View style={styles.rewardType}>
            <View style={[styles.typeIcon, { backgroundColor: '#FFD70020' }]}>
              <Text style={styles.typeEmoji}>👑</Text>
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>Weekly Rankings</Text>
              <Text style={styles.typeDesc}>Top 3 tippers and tipped users get 2-5% bonus rewards</Text>
            </View>
          </View>

          <View style={styles.rewardType}>
            <View style={[styles.typeIcon, { backgroundColor: '#FF6B6B20' }]}>
              <Text style={styles.typeEmoji}>🎂</Text>
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>Celebration Bonus</Text>
              <Text style={styles.typeDesc}>2-5% bonus when you hit your celebration goals</Text>
            </View>
          </View>

          <View style={styles.rewardType}>
            <View style={[styles.typeIcon, { backgroundColor: '#4ECDC420' }]}>
              <Text style={styles.typeEmoji}>🏆</Text>
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>Competition Prize</Text>
              <Text style={styles.typeDesc}>Win big prizes in tipping competitions (60/30/10 split)</Text>
            </View>
          </View>

          <View style={styles.rewardType}>
            <View style={[styles.typeIcon, { backgroundColor: '#45B7D120' }]}>
              <Text style={styles.typeEmoji}>⭐</Text>
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>Sponsor Rewards</Text>
              <Text style={styles.typeDesc}>Extra prizes from brand-sponsored challenges</Text>
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
  },

  rankingsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rankingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  rankingHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    marginBottom: 20,
  },
  rankingSection: {
    marginBottom: 16,
  },
  rankingItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  myRankingItem: {
    backgroundColor: '#4B008220',
    borderWidth: 2,
    borderColor: '#4B0082',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8e8e93',
    width: 30,
    textAlign: 'center',
  },
  topRank: {
    color: '#4c03c2ff',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userEmoji: {
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  myUsername: {
    color: '#4B0082',
  },
  displayName: {
    fontSize: 14,
    color: '#8e8e93',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
    padding: 16,
  },
  viewFullRankingsButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4B0082',
    borderRadius: 20,
    marginTop: 16,
  },
  viewFullText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 20,
  },
  rewardsCard: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  rewardItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardEmoji: {
    fontSize: 20,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
  rewardDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  rewardAmount: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 12,
  },
  emptyRewards: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#8e8e93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#4B0082',
  },
  infoCard: {
    backgroundColor: '#fff',
  },
  rewardTypes: {
    gap: 20,
  },
  rewardType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeEmoji: {
    fontSize: 20,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 18,
  },
  backButton: {
    padding: 8,
  },
  insightContainer: {
    backgroundColor: '#FFD70020',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  insightText: {
    fontSize: 14,
    color: '#1c1c1e',
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  dividerText: {
    fontSize: 12,
    color: '#8e8e93',
    marginHorizontal: 8,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    minWidth: 80,
  },
  rankingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  shareText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Achievement Badges Styles
  achievementsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  achievementsSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementsPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
});

export default RewardsScreen;
