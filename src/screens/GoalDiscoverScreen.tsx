import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { CreatorGoalDisplay } from '../components/CreatorGoalDisplay';

interface PublicGoal {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  goalAmount: number;
  currentAmount: number;
  title: string;
  description: string;
  emoji: string;
  progressPercentage: number;
  deadline: Date;
  category: string;
  supporterCount: number;
  lastUpdate: Date;
  isFeatured: boolean;
}

export const GoalDiscoverScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [goals, setGoals] = useState<PublicGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'trending' | 'newest' | 'near_deadline' | 'almost_complete'>('trending');
  const [category, setCategory] = useState<'all' | 'content' | 'equipment' | 'education' | 'community' | 'other'>('all');
  const [featuredGoal, setFeaturedGoal] = useState<PublicGoal | null>(null);

  const categories = [
    { key: 'all', label: 'All Goals', icon: 'grid-outline' },
    { key: 'content', label: 'Content Creation', icon: 'film-outline' },
    { key: 'equipment', label: 'Equipment', icon: 'construct-outline' },
    { key: 'education', label: 'Education', icon: 'school-outline' },
    { key: 'community', label: 'Community', icon: 'people-outline' },
    { key: 'other', label: 'Other', icon: 'gift-outline' },
  ];

  const filters = [
    { key: 'trending', label: '🔥 Trending' },
    { key: 'newest', label: '✨ Newest' },
    { key: 'near_deadline', label: '⏰ Ending Soon' },
    { key: 'almost_complete', label: '🏆 Almost Done' },
  ];

  useEffect(() => {
    loadGoals();
  }, [filter, category]);

  const loadGoals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: Replace with actual API call
      // const response = await apiService.getPublicGoals({ filter, category });

      // Mock data for now
      const mockGoals: PublicGoal[] = [
        {
          id: 'goal_featured',
          creatorId: 'creator_123',
          creatorName: 'Oluwaseyi Adebayo',
          creatorUsername: 'seyi_creative',
          goalAmount: 250000,
          currentAmount: 187500,
          title: 'Professional Studio Equipment',
          description: 'Setting up a professional studio to create high-quality content for my audience. Help me upgrade my tools!',
          emoji: '📽️',
          progressPercentage: 75,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: 'content',
          supporterCount: 147,
          lastUpdate: new Date(),
          isFeatured: true
        },
        {
          id: 'goal_new_1',
          creatorId: 'creator_456',
          creatorName: 'Amara Nkosi',
          creatorUsername: 'amara_music',
          goalAmount: 100000,
          currentAmount: 85000,
          title: 'New Guitar Purchase',
          description: 'My old guitar is worn out. Help me get a better instrument to continue making music!',
          emoji: '🎸',
          progressPercentage: 85,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          category: 'equipment',
          supporterCount: 89,
          lastUpdate: new Date(),
          isFeatured: false
        },
        {
          id: 'goal_trending',
          creatorId: 'creator_789',
          creatorName: 'David Okafor',
          creatorUsername: 'david_writer',
          goalAmount: 80000,
          currentAmount: 64000,
          title: 'Writing Course & Software',
          description: 'Enrolling in advanced writing courses and getting professional editing software.',
          emoji: '✍️',
          progressPercentage: 80,
          deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          category: 'education',
          supporterCount: 234,
          lastUpdate: new Date(),
          isFeatured: true
        }
      ];

      // Filter by category if not 'all'
      let filteredGoals = mockGoals;
      if (category !== 'all') {
        filteredGoals = mockGoals.filter(g => g.category === category);
      }

      // Sort by selected filter
      switch (filter) {
        case 'trending':
          // Mock trending: sort by supporterCount
          filteredGoals.sort((a, b) => b.supporterCount - a.supporterCount);
          break;
        case 'newest':
          filteredGoals.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
          break;
        case 'near_deadline':
          filteredGoals.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
          break;
        case 'almost_complete':
          filteredGoals.sort((a, b) => {
            const aRemaining = a.goalAmount - a.currentAmount;
            const bRemaining = b.goalAmount - b.currentAmount;
            return aRemaining - bRemaining;
          });
          break;
      }

      // Separate featured goal
      const featured = filteredGoals.find(g => g.isFeatured);
      const regularGoals = filteredGoals.filter(g => !g.isFeatured);

      setFeaturedGoal(featured || null);
      setGoals(regularGoals);

    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGoalTip = (goal: PublicGoal) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to tip towards goals.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth' as never) }
      ]);
      return;
    }

    // Navigate to tip screen with pre-selected recipient
    (navigation.navigate as any)('Tip', {
      recipientId: goal.creatorId,
      recipientName: goal.creatorName,
      goalSupport: goal // Pass goal context for tracking
    });
  };

  const handleRefresh = () => {
    loadGoals(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Discovering inspiring goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Goal Discovery</Text>
        <Text style={styles.headerSubtitle}>Find creators to support their amazing goals!</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Category Filters */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key as any)}
                style={[
                  styles.categoryChip,
                  category === cat.key && styles.activeCategoryChip
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={category === cat.key ? '#FFF' : '#4B0082'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.categoryText,
                  category === cat.key && styles.activeCategoryText
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((filt) => (
            <TouchableOpacity
              key={filt.key}
              onPress={() => setFilter(filt.key as typeof filter)}
              style={[
                styles.filterChip,
                filter === filt.key && styles.activeFilterChip
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === filt.key && styles.activeFilterText
              ]}>
                {filt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Goal */}
        {featuredGoal && (
          <Card style={styles.featuredCard} padding={0}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>🌟 FEATURED</Text>
            </View>

            <CreatorGoalDisplay
              creatorId={featuredGoal.creatorId}
              creatorUsername={featuredGoal.creatorUsername}
              onTipPress={() => handleGoalTip(featuredGoal)}
              compact={false}
            />

            <View style={styles.goalMeta}>
              <Text style={styles.creatorMeta}>
                by <Text style={styles.creatorName}>{featuredGoal.creatorName}</Text>
              </Text>
              <View style={styles.goalStats}>
                <Text style={styles.goalsStatText}>👥 {featuredGoal.supporterCount} supporters</Text>
                <Text style={styles.goalsStatText}>🕐 {Math.ceil((featuredGoal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Goals List */}
        <View style={styles.goalsList}>
          <Text style={styles.sectionTitle}>
            {filter === 'trending' ? '🔥 Trending Goals' :
             filter === 'newest' ? '✨ Latest Goals' :
             filter === 'near_deadline' ? '⏰ Urgent Goals' :
             '🏆 Almost Complete'}
          </Text>

          {goals.length > 0 ? (
            goals.map((goal) => (
              <Card key={goal.id} style={styles.goalCard} padding={0}>
                <CreatorGoalDisplay
                  creatorId={goal.creatorId}
                  creatorUsername={goal.creatorUsername}
                  onTipPress={() => handleGoalTip(goal)}
                  compact={false}
                />

                <View style={styles.goalMeta}>
                  <Text style={styles.creatorMeta}>
                    by <Text style={styles.creatorName}>{goal.creatorName}</Text>
                  </Text>
                  <View style={styles.goalStats}>
                    <Text style={styles.goalsStatText}>👥 {goal.supporterCount} supporters</Text>
                    <Text style={styles.goalsStatText}>🕐 {Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard} padding={30}>
              <Ionicons name="search-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No {category !== 'all' ? category : ''} goals found</Text>
              <Text style={styles.emptyText}>Try changing filters or check back later for new goals!</Text>
              <TouchableOpacity
                onPress={() => {
                  setFilter('trending');
                  setCategory('all');
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Show All Goals</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    padding: 20,
    backgroundColor: '#4B0082',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#F8F9FA',
  },
  activeCategoryChip: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B0082',
  },
  activeCategoryText: {
    color: '#FFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  activeFilterChip: {
    backgroundColor: '#4B0082',
  },
  filterText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFF',
  },
  featuredCard: {
    margin: 16,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  goalsList: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  goalMeta: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorMeta: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  creatorName: {
    color: '#4B0082',
    fontWeight: '500',
  },
  goalStats: {
    alignItems: 'flex-end',
  },
  goalsStatText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4B0082',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 40,
  },
});
