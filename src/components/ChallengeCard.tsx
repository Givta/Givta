import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';

export interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description?: string;
    category?: 'personal' | 'celebration' | 'competition' | 'sponsored';
    type?: 'personal' | 'competition' | 'sponsored';
    coverImageUrl?: string;
    totalTips?: number;
    totalAmount?: number;
    totalParticipants?: number;
    currentAmount?: number;
    goalAmount?: number;
    maxParticipants?: number;
    entryFee?: number;
    sponsorName?: string;
    status?: 'draft' | 'active' | 'running' | 'ended' | 'paid_out' | 'cancelled';
    upvotes?: number;
    downvotes?: number;
    hashtags?: string[];
    shareableUrl?: string;
    totalViews?: number;
    totalShares?: number;
    startDate?: any;
    endDate?: any;
    isPublic?: boolean;
    isDeleted?: boolean;
    createdAt?: any;
    updatedAt?: any;
    bonusPercentage?: number;
    prizeSplitRatios?: { 1: number; 2: number; 3: number };
    // Add backward compatibility
    name?: string; // fallback for old data
  };
  onPress: () => void;
  onTip?: () => void;
  onShare?: () => void;
  isLive?: boolean;
  showProgress?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2;

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  onTip,
  onShare,
  isLive = false,
  showProgress = true,
  variant = 'default'
}) => {
  const getCategoryConfig = () => {
    switch (challenge.category) {
      case 'personal':
      case 'celebration':
        return {
          icon: '🎂',
          color: '#e3f2fd',
          accentColor: '#2196f3',
          label: 'Personal'
        };
      case 'competition':
        return {
          icon: '🏅',
          color: '#f3e5f5',
          accentColor: '#9c27b0',
          label: 'Competition'
        };
      case 'sponsored':
        return {
          icon: '⭐',
          color: '#fff3e0',
          accentColor: '#ff9800',
          label: 'Sponsored'
        };
      default:
        return {
          icon: '🎯',
          color: '#e8f5e8',
          accentColor: '#4caf50',
          label: 'Challenge'
        };
    }
  };

  const categoryConfig = getCategoryConfig();
  const progressPercent = challenge.goalAmount ?
    Math.min((((challenge.currentAmount || 0) / challenge.goalAmount) * 100), 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} style={styles.compactContainer}>
        <Card style={[styles.compactCard, { backgroundColor: categoryConfig.color }]}>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          <View style={styles.compactContent}>
            <Text style={styles.compactIcon}>{categoryConfig.icon}</Text>

            <View style={styles.compactTextContainer}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {challenge.title}
              </Text>
              <Text style={styles.compactAmount}>
                {formatCurrency(challenge.totalAmount || 0)}
              </Text>
            </View>

            <View style={styles.compactStats}>
              <View style={styles.stat}>
                <Ionicons name="heart" size={12} color={categoryConfig.accentColor} />
                <Text style={[styles.statText, { color: categoryConfig.accentColor }]}>
                  {challenge.totalTips || 0}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={onPress} style={styles.featuredContainer}>
        <Card style={styles.featuredCard}>
          {challenge.coverImageUrl ? (
            <Image source={{ uri: challenge.coverImageUrl }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredPlaceholder, { backgroundColor: categoryConfig.color }]}>
              <Text style={styles.featuredPlaceholderEmoji}>{categoryConfig.icon}</Text>
            </View>
          )}

          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.featuredOverlay}
          >
            <View style={styles.featuredContent}>
              <View style={styles.featuredHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
                  <Text style={styles.categoryText}>{categoryConfig.label}</Text>
                </View>

                {onShare && (
                  <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.featuredTextContainer}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {challenge.title}
                </Text>

                {showProgress && challenge.category === 'personal' && (
                  <View style={styles.featuredProgress}>
                    <Text style={styles.featuredProgressText}>
                      {formatCurrency(challenge.currentAmount || 0)} / {formatCurrency(challenge.goalAmount || 0)}
                    </Text>
                    <View style={styles.featuredProgressBar}>
                      <View
                        style={[styles.featuredProgressFill, { width: `${progressPercent}%` }]}
                      />
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.featuredFooter}>
                <View style={styles.featuredStats}>
              <Text style={styles.featuredStat}>
                    💰 {formatCurrency(challenge.totalAmount || 0)}
                  </Text>
                  <Text style={styles.featuredStat}>
                    🙌 {formatNumber(challenge.totalTips || 0)}
                  </Text>
                  {challenge.category === 'competition' && (
                    <Text style={styles.featuredStat}>
                      👥 {challenge.totalParticipants}
                    </Text>
                  )}
                </View>

                {onTip && (
                  <TouchableOpacity
                    onPress={onTip}
                    style={[styles.tipButton, { backgroundColor: categoryConfig.accentColor }]}
                  >
                    <Text style={styles.tipButtonText}>Tip Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        {challenge.coverImageUrl ? (
          <Image source={{ uri: challenge.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: categoryConfig.color }]}>
            <Text style={styles.placeholderEmoji}>{categoryConfig.icon}</Text>
          </View>
        )}

        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
              <Text style={styles.categoryText}>{categoryConfig.label}</Text>
            </View>

            {challenge.upvotes !== undefined && (
              <View style={styles.votes}>
                <TouchableOpacity style={styles.voteButton}>
                  <Ionicons name="thumbs-up-outline" size={14} color="#8e8e93" />
                </TouchableOpacity>
                <Text style={styles.voteText}>
                  {challenge.upvotes}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
            </Text>
          </View>

          {challenge.description && (
            <Text style={styles.description} numberOfLines={2}>
              {challenge.description}
            </Text>
          )}

          {showProgress && challenge.category === 'personal' && challenge.goalAmount && (
            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {formatCurrency(challenge.currentAmount || 0)} / {formatCurrency(challenge.goalAmount)}
                </Text>
                <Text style={styles.progressPercent}>
                  {progressPercent.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, {
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent >= 100 ? '#34c759' : categoryConfig.accentColor
                  }]}
                />
              </View>
            </View>
          )}

          {challenge.category === 'competition' && (
            <View style={styles.competitionInfo}>
              <Text style={styles.competitionDetail}>
                👥 {challenge.totalParticipants}/{challenge.maxParticipants || '∞'} participants
              </Text>
              {challenge.entryFee && challenge.entryFee > 0 && (
                <Text style={styles.competitionDetail}>
                  💰 Entry: {formatCurrency(challenge.entryFee)}
                </Text>
              )}
            </View>
          )}

          {challenge.category === 'sponsored' && challenge.sponsorName && (
            <View style={[styles.sponsorBadge, { backgroundColor: categoryConfig.color }]}>
              <Text style={[styles.sponsorText, { color: categoryConfig.accentColor }]}>
                Sponsored by {challenge.sponsorName}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="trending-up" size={16} color="#8e8e93" />
                <Text style={styles.statText}>{formatNumber(challenge.totalTips || 0)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="cash" size={16} color="#8e8e93" />
                <Text style={styles.statText}>{formatCurrency(challenge.totalAmount || 0)}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {onTip && (
                <TouchableOpacity
                  onPress={onTip}
                  style={[styles.actionButton, { backgroundColor: categoryConfig.accentColor }]}
                >
                  <Ionicons name="heart" size={14} color="#fff" />
                </TouchableOpacity>
              )}

              {onShare && (
                <TouchableOpacity onPress={onShare} style={styles.actionButton}>
                  <Ionicons name="share-outline" size={14} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {challenge.status !== 'active' && (
          <View style={[styles.statusOverlay, {
            backgroundColor: challenge.status === 'ended' ? 'rgba(52, 199, 89, 0.9)' :
                           challenge.status === 'paid_out' ? 'rgba(88, 86, 214, 0.9)' : 'rgba(142, 142, 147, 0.9)'
          }]}>
            <Text style={styles.statusOverlayText}>
              {challenge.status === 'ended' ? 'COMPLETED' :
               challenge.status === 'paid_out' ? 'PAID OUT' :
               (challenge.status || 'UNKNOWN').toUpperCase()}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default variant styles
  container: {
    marginHorizontal: 8,
    marginVertical: 4,
    width: cardWidth,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coverImage: {
    height: 120,
    width: '100%',
  },
  placeholder: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    padding: 4,
  },
  voteText: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 4,
  },
  titleContainer: {
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: '#8e8e93',
    lineHeight: 18,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B0082',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e5e9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B0082',
    borderRadius: 2,
  },
  competitionInfo: {
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  competitionDetail: {
    fontSize: 11,
    color: '#9c27b0',
    fontWeight: '500',
  },
  sponsorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  sponsorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  // Compact variant styles
  compactContainer: {
    marginHorizontal: 4,
    marginVertical: 2,
    width: (screenWidth - 40) / 3,
  },
  compactCard: {
    borderRadius: 12,
    aspectRatio: 1,
    padding: 8,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  compactTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B0082',
    textAlign: 'center',
  },
  compactStats: {
    alignItems: 'center',
  },

  // Featured variant styles
  featuredContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredPlaceholderEmoji: {
    fontSize: 80,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  featuredTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredProgress: {
    marginTop: 8,
  },
  featuredProgressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  featuredProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredStat: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Shared styles
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
