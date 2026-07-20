import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const bannerWidth = Math.min(320, screenWidth - 32); // Standard banner size, responsive

interface SponsoredChallengeBannerProps {
  onJoinPress?: () => void;
  sponsorLogo?: string; // Placeholder for logo URL
  onSponsorPress?: () => void;
}

export const SponsoredChallengeBanner: React.FC<SponsoredChallengeBannerProps> = ({
  onJoinPress,
  sponsorLogo,
  onSponsorPress
}) => {
  return (
    <View style={[styles.container, { width: bannerWidth }]}>
      <View style={styles.content}>
        {/* Sponsor Logo Placeholder */}
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={onSponsorPress}
          disabled={!onSponsorPress}
        >
          {sponsorLogo ? (
            // If logo URL provided, show it
            <View style={styles.logoPlaceholder}>
              {/* Replace with Image component when logo URL is available */}
              <Ionicons name="business" size={24} color="#4B0082" />
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.headline} numberOfLines={1}>
            🔥 Sponsor Challenge – Every Friday
          </Text>
          <Text style={styles.subtext} numberOfLines={2}>
            Compete. Win. Earn Big Rewards 🚀
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={onJoinPress}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>Join Now</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Decorative elements */}
      <View style={styles.highlightBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: (screenWidth - bannerWidth) / 2,
    marginVertical: 8,

    // Shadow effects
    shadowColor: '#4B0082',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

    // Border styling
    borderWidth: 1,
    borderColor: '#f0e6ff',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 8,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6d7ff',
  },
  logoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 1,
  },
  subtext: {
    fontSize: 9,
    color: '#8e8e93',
    lineHeight: 10,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B0082',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginRight: 2,
  },
  highlightBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4B0082',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});
