import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { ProgressBar } from './ProgressBar';
import { Card } from './Card';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface CreatorGoal {
  id: string;
  creatorId: string;
  goalAmount: number;
  currentAmount: number;
  title: string;
  description: string;
  emoji: string;
  isActive: boolean;
  isCompleted: boolean;
  goalType: string;
  progressPercentage: number;
  stats: {
    totalSupporters: number;
    totalTips: number;
    daysActive: number;
    averageDailyTips: number;
    largestTip: number;
  };
  settings: {
    showProgress: boolean;
    showContributors: boolean;
    allowAnonymousTips: boolean;
    notifyOnCompletion: boolean;
  };
}

interface CreatorGoalDisplayProps {
  creatorId: string;
  creatorUsername?: string;
  onTipPress?: () => void;
  onGoalPress?: (goal: CreatorGoal) => void;
  compact?: boolean;
}

export const CreatorGoalDisplay: React.FC<CreatorGoalDisplayProps> = ({
  creatorId,
  creatorUsername,
  onTipPress,
  onGoalPress,
  compact = false
}) => {
  const [activeGoal, setActiveGoal] = useState<CreatorGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreatorGoal();
  }, [creatorId]);

  const loadCreatorGoal = async () => {
    try {
      // TODO: Replace with actual API call
      // const goal = await tippingGoalService.getActiveGoal(creatorId);

      // Mock data - simulate loading a goal
      // This would normally fetch from the server
      const mockGoal: CreatorGoal = {
        id: 'goal_demo',
        creatorId: creatorId,
        goalAmount: 75000,
        currentAmount: 48700,
        title: "Professional Microphone Setup",
        description: "Help me upgrade my audio equipment for better content quality and clearer streams!",
        emoji: "🎤",
        isActive: true,
        isCompleted: false,
        goalType: 'monthly',
        progressPercentage: 65,
        stats: {
          totalSupporters: 28,
          totalTips: 47,
          daysActive: 12,
          averageDailyTips: 8.5,
          largestTip: 5200
        },
        settings: {
          showProgress: true,
          showContributors: true,
          allowAnonymousTips: false,
          notifyOnCompletion: true
        }
      };

      // Only set if settings allow showing progress
      setActiveGoal(mockGoal.settings.showProgress ? mockGoal : null);
    } catch (error) {
      console.error('Error loading goal:', error);
      setActiveGoal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalPress = () => {
    if (activeGoal && onGoalPress) {
      onGoalPress(activeGoal);
    } else {
      // Show goal details in alert
      const buttons: any[] = [{ text: 'Close' }];
      if (onTipPress) {
        buttons.push({ text: 'Support Goal 💰', onPress: onTipPress });
      }

      Alert.alert(
        `${activeGoal?.emoji} ${activeGoal?.title}`,
        `${activeGoal?.description}\n\nProgress: ₦${activeGoal?.currentAmount.toLocaleString()} / ₦${activeGoal?.goalAmount.toLocaleString()} (${activeGoal?.progressPercentage}%)\n\n${activeGoal?.stats.totalSupporters} supporters, ${activeGoal?.stats.totalTips} tips`,
        buttons
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPlaceholder}>
          <Ionicons name="trophy-outline" size={24} color="#8E8E93" />
        </View>
      </View>
    );
  }

  if (!activeGoal) {
    return null; // No active goal to show
  }

  if (compact) {
    // Compact version for profile headers/summaries
    return (
      <TouchableOpacity onPress={handleGoalPress} style={styles.compactContainer} activeOpacity={0.8}>
        <View style={styles.compactContent}>
          <Text style={styles.compactEmoji}>{activeGoal.emoji}</Text>
          <View style={styles.compactText}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {activeGoal.title}
            </Text>
            <Text style={styles.compactProgress}>
              ₦{activeGoal.currentAmount.toLocaleString()} / ₦{activeGoal.goalAmount.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.compactPercentage}>{activeGoal.progressPercentage}%</Text>
        </View>
        <ProgressBar
          goalAmount={activeGoal.goalAmount}
          currentAmount={activeGoal.currentAmount}
          emoji={activeGoal.emoji}
          size="small"
          showPercent={false}
          showAmount={false}
          animated={false}
        />
      </TouchableOpacity>
    );
  }

  // Full version for detailed displays
  return (
    <Card style={styles.goalCard} padding={16}>
      <TouchableOpacity onPress={handleGoalPress} activeOpacity={0.8}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIcon}>
            <Text style={styles.goalEmoji}>{activeGoal.emoji}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle} numberOfLines={2}>
              {activeGoal.title}
            </Text>
            <Text style={styles.goalStatus}>
              {activeGoal.isCompleted ? '🟢 Completed!' : `⏳ ${activeGoal.stats.daysActive} days active`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleGoalPress}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={20} color="#4B0082" />
          </TouchableOpacity>
        </View>

        <View style={styles.goalProgress}>
          <ProgressBar
            goalAmount={activeGoal.goalAmount}
            currentAmount={activeGoal.currentAmount}
            emoji={activeGoal.emoji}
            size="medium"
            animated={true}
          />
        </View>

        <View style={styles.goalStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeGoal.stats.totalSupporters}</Text>
            <Text style={styles.statLabel}>Supporters</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeGoal.stats.averageDailyTips?.toFixed(1) || '0'}</Text>
            <Text style={styles.statLabel}>Tips/Day</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            onPress={onTipPress}
            style={styles.supportButton}
          >
            <Text style={styles.supportButtonText}>💰 Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.goalDescription} numberOfLines={2}>
          {activeGoal.description}
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  loadingPlaceholder: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  compactProgress: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  goalStatus: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoButton: {
    padding: 4,
  },
  goalProgress: {
    marginBottom: 16,
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E1E5E9',
    marginHorizontal: 12,
  },
  supportButton: {
    backgroundColor: '#4B0082',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  supportButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
});

export default CreatorGoalDisplay;
