import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  goalAmount: number;
  currentAmount: number;
  emoji?: string;
  showMilestone?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  backgroundColor?: string;
  showPercent?: boolean;
  showAmount?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  goalAmount,
  currentAmount,
  emoji = '🎯',
  showMilestone = true,
  animated = true,
  size = 'medium',
  showPercent = true,
  showAmount = true,
  color = '#4B0082',
  backgroundColor = '#F8F9FA'
}) => {
  const [animation] = useState(new Animated.Value(0));
  const progress = Math.min(currentAmount / goalAmount, 1);

  useEffect(() => {
    if (animated) {
      Animated.timing(animation, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animation.setValue(progress);
    }
  }, [progress, animated, animation]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 8, borderRadius: 4 };
      case 'large':
        return { height: 24, borderRadius: 12 };
      case 'medium':
      default:
        return { height: 16, borderRadius: 8 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  };

  const sizeStyles = getSizeStyles();
  const textSize = getTextSize();

  return (
    <View style={styles.container}>
      {showMilestone && size !== 'small' && (
        <View style={styles.milestoneContainer}>
          <Text style={[styles.emojiText, { fontSize: textSize + 4 }]}>{emoji}</Text>
          <View style={styles.milestoneContent}>
            <Text style={[styles.milestoneText, { fontSize: textSize - 2 }]}>
              {showPercent && `${(progress * 100).toFixed(1)}%`}
            </Text>
            {showAmount && (
              <Text style={[styles.amountText, { fontSize: textSize - 2 }]}>
                ₦{(currentAmount || 0).toLocaleString()} / ₦{goalAmount.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={[styles.progressContainer, { backgroundColor }, sizeStyles]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
            sizeStyles
          ]}
        />

        {/* Progress markers for milestones */}
        {[0.25, 0.5, 0.75, 1.0].map((milestone, index) => (
          <View
            key={index}
            style={[
              styles.milestoneMarker,
              {
                left: `${milestone * 100}%`,
                opacity: progress >= milestone ? 1 : 0.3,
                backgroundColor: progress >= milestone ? color : '#8E8E93',
              }
            ]}
          />
        ))}
      </View>

      {/* Always show progress info at bottom for accessibility */}
      {(!showMilestone || size === 'small') && (
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomText, { fontSize: textSize }]}>
            {showPercent ? `${(progress * 100).toFixed(1)}%` : ''}
            {showPercent && showAmount ? ' • ' : ''}
            {showAmount ? `₦${(currentAmount || 0).toLocaleString()} / ₦${goalAmount.toLocaleString()}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiText: {
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneText: {
    fontWeight: 'bold',
    color: '#4B0082',
  },
  amountText: {
    color: '#8E8E93',
  },
  progressContainer: {
    position: 'relative',
    width: '100%',
  },
  progressFill: {
    borderRadius: 8,
  },
  milestoneMarker: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '50%',
    marginTop: -2,
    zIndex: 1,
  },
  bottomInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  bottomText: {
    color: '#8E8E93',
    fontWeight: '500',
  },
});
