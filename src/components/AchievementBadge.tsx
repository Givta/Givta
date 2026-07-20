import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type AchievementType = 'first_contribution' | 'goal_helper' | 'goal_contributor' | 'goal_achiever';

interface AchievementBadgeProps {
  badge: AchievementType;
  earnedAt: Date;
  goalTitle?: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  earnedAt,
  goalTitle,
  size = 'medium',
  showDetails = true,
  onPress
}) => {
  const badgeConfig = getBadgeConfig(badge);
  const sizeConfig = getSizeConfig(size);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          minWidth: sizeConfig.width,
          padding: sizeConfig.padding
        },
        badgeConfig.gradientStyle
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.badgeContent}>
        <Text style={[styles.badgeEmoji, { fontSize: sizeConfig.emojiSize }]}>
          {badgeConfig.emoji}
        </Text>

        {size !== 'small' && (
          <View style={styles.textContent}>
            <Text style={[styles.badgeTitle, { fontSize: sizeConfig.titleSize }]}>
              {badgeConfig.title}
            </Text>
            {showDetails && (
    <Text style={[styles.badgeDescription, { fontSize: sizeConfig.descSize }]} numberOfLines={2}>
      {badgeConfig.description}
    </Text>
            )}
            {goalTitle && showDetails && (
              <Text style={[styles.badgeGoal, { fontSize: sizeConfig.descSize - 1 }]}>
                "{goalTitle}"
              </Text>
            )}
            <Text style={[styles.badgeDate, { fontSize: sizeConfig.dateSize }]}>
              Earned {formatDate(earnedAt)}
            </Text>
          </View>
        )}
      </View>

      {badgeConfig.isNew && (
        <View style={styles.newIndicator}>
          <Text style={styles.newText}>NEW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const getBadgeConfig = (badge: AchievementType) => {
  const configs = {
    first_contribution: {
      emoji: '🎯',
      title: 'First Goals',
      description: 'Your first contribution to any goal!',
      gradientStyle: styles.gradientFirst,
      isNew: true
    },
    goal_helper: {
      emoji: '🙌',
      title: 'Goal Helper',
      description: 'Helped a creator reach their goal!',
      gradientStyle: styles.gradientHelper,
      isNew: false
    },
    goal_contributor: {
      emoji: '⭐',
      title: 'Goal Contributor',
      description: 'Multiple contributions to the same goal!',
      gradientStyle: styles.gradientContributor,
      isNew: false
    },
    goal_achiever: {
      emoji: '🏆',
      title: 'Goal Achiever',
      description: 'Helped complete a goal (75%+ progress)!',
      gradientStyle: styles.gradientAchiever,
      isNew: false
    }
  };

  return configs[badge];
};

const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        width: 60,
        padding: 8,
        emojiSize: 16,
        titleSize: 0,
        descSize: 0,
        dateSize: 0
      };
    case 'large':
      return {
        width: 140,
        padding: 20,
        emojiSize: 48,
        titleSize: 18,
        descSize: 14,
        dateSize: 12
      };
    case 'medium':
    default:
      return {
        width: 120,
        padding: 12,
        emojiSize: 32,
        titleSize: 16,
        descSize: 12,
        dateSize: 10
      };
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: 'center',
    margin: 4,
  },
  badgeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    marginBottom: 4,
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 100,
  },
  badgeTitle: {
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDescription: {
    color: '#F0F0F0',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeGoal: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  badgeDate: {
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 2,
  },
  newIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  newText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Gradient styles (using backgroundColor as simulation)
  gradientFirst: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  gradientHelper: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
  },
  gradientContributor: {
    backgroundColor: '#45B7D1',
    shadowColor: '#45B7D1',
  },
  gradientAchiever: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
});
