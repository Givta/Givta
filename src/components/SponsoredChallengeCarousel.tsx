import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

// Static placeholder imported at module-level so Metro bundles it correctly
const placeholderIcon = require('../../assets/icon.png');

const { width } = Dimensions.get('window');

interface SponsoredChallengeCarousel {
  id: string;
  title: string;
  sponsorInfo: {
    sponsorName: string;
    sponsorLogo: string;
  };
  prizePool: {
    totalAmount: number;
  };
  analytics: {
    participantsCount: number;
  };
}

interface SponsoredChallengeCarouselProps {
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

export const SponsoredChallengeCarousel: React.FC<SponsoredChallengeCarouselProps> = ({
  autoScroll = true,
  autoScrollInterval = 4000,
}) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [challenges, setChallenges] = useState<SponsoredChallengeCarousel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sponsored challenges from API
  useEffect(() => {
    const fetchSponsoredChallenges = async () => {
      try {
        setLoading(true);
        // Build API URL from environment
        const rawBase = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const base = rawBase.replace(/\/+$/g, ''); // remove trailing slashes
        const hasApi = base.endsWith('/api');
        const url = hasApi ? `${base}/challenges/sponsored` : `${base}/challenges/sponsored`;

        // Get Firebase auth token
        const { auth } = require('../../firebase');
        const user = auth().currentUser;
        let token = null;
        if (user) {
          token = await user.getIdToken();
        }

        const response = await fetch(url, {
          method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          let fetchedChallenges: SponsoredChallengeCarousel[] = result.data || [];

          // Take only first 3 featured challenges for carousel
          fetchedChallenges = fetchedChallenges.slice(0, 3);

          setChallenges(fetchedChallenges);
        } else {
          // On error, keep empty array
          setChallenges([]);
        }
      } catch (error) {
        console.error('Error fetching sponsored challenges:', error);
        // On error, keep empty array
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsoredChallenges();
  }, []);

  // Auto scroll functionality
  useEffect(() => {
    if (!autoScroll || challenges.length === 0) return;

    const interval = setInterval(() => {
      if (isScrolling) return; // Don't interrupt manual scrolling

      const nextIndex = (currentIndex + 1) % challenges.length;
      scrollToIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [currentIndex, autoScroll, autoScrollInterval, isScrolling, challenges.length]);

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (scrollViewRef.current) {
      const x = index * (width - 48); // Card width + margin
      scrollViewRef.current.scrollTo({ x, animated: true });
    }
  };

  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (width - 48));
    setCurrentIndex(index);
    setTimeout(() => setIsScrolling(false), 100);
  };

  const handleScrollBegin = () => {
    setIsScrolling(true);
  };

  const handleChallengePress = (challengeId: string) => {
    (navigation as any).navigate('SponsoredChallengeDetail', { challengeId });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount).replace('.00', '');
  };

  if (challenges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy-outline" size={20} color="#4B0082" />
          <Text style={styles.headerTitle}>💰 Sponsored Challenges</Text>
        </View>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('SponsoredChallengeDiscovery')}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#4B0082" />
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={width - 48} // Card width + margin
          decelerationRate="fast"
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={styles.scrollContent}
        >
          {challenges.map((challenge, index) => (
            <TouchableOpacity
              key={challenge.id}
              style={[styles.challengeCard, index === 0 && styles.firstCard]}
              onPress={() => handleChallengePress(challenge.id)}
              activeOpacity={0.9}
            >
              {/* Featured Badge */}
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Sponsored</Text>
              </View>

              {/* Sponsor Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: challenge.sponsorInfo.sponsorLogo }}
                  style={styles.sponsorLogo}
                  defaultSource={placeholderIcon}
                />
              </View>

              {/* Challenge Info */}
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeTitle} numberOfLines={2}>
                  {challenge.title}
                </Text>

                <View style={styles.sponsorInfo}>
                  <Text style={styles.sponsorName}>
                    by {challenge.sponsorInfo.sponsorName}
                  </Text>
                </View>

                <View style={styles.prizeContainer}>
                  <View style={styles.prizeItem}>
                    <Ionicons name="cash-outline" size={14} color="#34c759" />
                    <Text style={styles.prizeAmount}>
                      {formatCurrency(challenge.prizePool.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.prizeItem}>
                    <Ionicons name="people-outline" size={14} color="#4B0082" />
                    <Text style={styles.participantsCount}>
                      {challenge.analytics.participantsCount} joined
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicators */}
        <View style={styles.indicators}>
          {challenges.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B0082',
  },
  carouselContainer: {
    position: 'relative',
  },
  scrollContent: {
    paddingRight: 16,
  },
  challengeCard: {
    width: width - 64, // Screen width - padding
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  firstCard: {
    marginLeft: 0,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textTransform: 'uppercase',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sponsorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  challengeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 20,
  },
  sponsorInfo: {
    marginBottom: 8,
  },
  sponsorName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  prizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 4,
  },
  participantsCount: {
    fontSize: 12,
    color: '#4B0082',
    marginLeft: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E1E5E9',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#4B0082',
    width: 24, // Active indicator is wider
  },
});
