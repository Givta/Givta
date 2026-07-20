import { Share, Linking, Alert, Platform, Clipboard } from 'react-native';

export interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  urlScheme: string;
  webUrl: string;
}

export class SocialSharingService {
  private static platforms: SharePlatform[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      urlScheme: 'whatsapp://send?text=',
      webUrl: 'https://wa.me/?text=',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'paper-plane',
      urlScheme: 'tg://msg?text=',
      webUrl: 'https://t.me/share/url?url=',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'logo-twitter',
      urlScheme: 'twitter://post?message=',
      webUrl: 'https://twitter.com/intent/tweet?text=',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      urlScheme: 'fb://post?message=',
      webUrl: 'https://www.facebook.com/sharer/sharer.php?u=',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      urlScheme: 'instagram://story/create?text=',
      webUrl: 'https://www.instagram.com/',
    },
  ];

  /**
   * Share content using native share sheet
   */
  static async shareNative(message: string, url?: string): Promise<boolean> {
    try {
      const result = await Share.share({
        message: url ? `${message}\n\n${url}` : message,
        url: url,
      });

      return result.action === 'sharedAction';
    } catch (error) {
      console.error('Error sharing natively:', error);
      Alert.alert('Error', 'Failed to share content');
      return false;
    }
  }

  /**
   * Share to specific platform
   */
  static async shareToPlatform(platformId: string, message: string, url?: string): Promise<void> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) {
      Alert.alert('Error', 'Platform not supported');
      return;
    }

    const shareText = url ? `${message}\n\n${url}` : message;
    const encodedText = encodeURIComponent(shareText);

    try {
      // Try native app first
      const appUrl = `${platform.urlScheme}${encodedText}`;
      const canOpen = await Linking.canOpenURL(appUrl);

      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }

      // Fall back to web URL
      const webUrl = platformId === 'instagram'
        ? platform.webUrl
        : `${platform.webUrl}${encodedText}`;

      const canOpenWeb = await Linking.canOpenURL(webUrl);
      if (canOpenWeb) {
        await Linking.openURL(webUrl);
        return;
      }

      // Final fallback to native share
      await this.shareNative(message, url);
    } catch (error) {
      console.error(`Error sharing to ${platform.name}:`, error);
      // Fallback to native share
      await this.shareNative(message, url);
    }
  }

  /**
   * Share challenge content
   */
  static async shareChallenge(
    platformId: string,
    challengeTitle: string,
    challengeUrl: string,
    customMessage?: string
  ): Promise<void> {
    const defaultMessage = `🎉 Check out my challenge: ${challengeTitle}`;
    const message = customMessage || defaultMessage;

    await this.shareToPlatform(platformId, message, challengeUrl);
  }

  /**
   * Share category-specific challenge content
   */
  static async shareCategoryChallenge(
    platformId: string,
    challenge: any,
    participantId?: string
  ): Promise<void> {
    let message = '';
    let shareableUrl = '';

    // Base API URL for external tipping (should be configurable)
    const API_BASE = 'https://your-givta-api.com/api/public-tips'; // TODO: Make configurable

    switch (challenge.category) {
      case 'celebration':
        message = `🎂 Help ${challenge.creatorName || 'me'} reach their goal!\n\n`;
        message += `${challenge.title}\n`;
        message += `Progress: ${challenge.progressPercent?.toFixed(0) || 0}% toward ${challenge.goalAmount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) || 'goal'}\n\n`;
        message += `Tip any amount to support this celebration! 💝`;
        shareableUrl = `${API_BASE}/celebration/${challenge.id}`;
        break;

      case 'competition':
        if (participantId) {
          // Personal competitor tipping link - for individual athlete/player sponsorship
          const participant = challenge.competitionSettings?.participants?.find((p: any) => p.userId === participantId);
          if (participant) {
            message = `🏆 SUPPORT ME: ${participant.name}\n\n`;
            message += `Competition: ${challenge.title}\n`;
            message += challenge.competitionSettings?.venueInfo ? `📍 Venue: ${challenge.competitionSettings.venueInfo}\n` : '';
            message += `Prize Pool Distribution:\n`;
            message += `🥇 60% • 🥈 30% • 🥉 10%\n\n`;
            message += `Your tip helps me win big! 💪✨`;
            shareableUrl = `${API_BASE}/competition/${challenge.id}/participant/${participantId}`;
          }
        } else {
          // Competition overview link
          const maxParticipants = challenge.competitionSettings?.maxParticipants || 'Unlimited';
          message = `🏟️ ${challenge.title}\n\n`;
          message += challenge.competitionSettings?.venueInfo ? `📍 Venue: ${challenge.competitionSettings.venueInfo}\n` : '';
          message += `👥 Max Competitors: ${maxParticipants}\n`;
          message += `💰 Prize Distribution: 60% / 30% / 10%\n\n`;
          message += `Support your favorite competitor! 🔥`;
          shareableUrl = challenge.shareableUrl || `${API_BASE}/challenge/${challenge.id}`;
        }
        break;

      case 'sponsored':
        message = `⭐ Join this exclusive ${challenge.sponsorInfo?.sponsorName || 'sponsored'} challenge!\n\n`;
        message += `${challenge.title}\n`;
        if (challenge.sponsorInfo?.additionalPrizeValue) {
          message += `+ Extra ₦${challenge.sponsorInfo.additionalPrizeValue.toLocaleString()} in prizes!\n`;
        }
        message += `${challenge.description?.substring(0, 100)}${challenge.description?.length > 100 ? '...' : ''}\n\n`;

        // Add task instructions if applicable
        if (challenge.templatedSettings?.howToPlay) {
          message += `How to win: ${challenge.templatedSettings.howToPlay}\n\n`;
        }

        message += `Join now and compete for prizes! 🎁`;
        shareableUrl = challenge.shareableUrl || `${API_BASE}/challenge/${challenge.id}`;
        break;

      default:
        // Fallback to generic sharing
        message = `🎯 Check out this challenge: ${challenge.title}`;
        shareableUrl = challenge.shareableUrl || `${API_BASE}/challenge/${challenge.id}`;
        break;
    }

    // Add common hashtags and footer
    message += `\n\n#Givta #TippingChallenge #${challenge.category?.charAt(0).toUpperCase()}${challenge.category?.slice(1)}`;

    await this.shareToPlatform(platformId, message, shareableUrl);
  }

  /**
   * Get available platforms
   */
  static getPlatforms(): SharePlatform[] {
    return this.platforms;
  }

  /**
   * Check if platform is available on device
   */
  static async isPlatformAvailable(platformId: string): Promise<boolean> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) return false;

    try {
      const canOpen = await Linking.canOpenURL(platform.urlScheme);
      return canOpen;
    } catch {
      return false;
    }
  }

  /**
   * Get sharing options for a challenge
   */
  static async getChallengeShareOptions(challenge: {
    title: string;
    description: string;
    shareableUrl: string;
    social?: { customMessage?: string };
  }) {
    const message = challenge.social?.customMessage ||
      `${challenge.title}\n\n${challenge.description}\n\n#Givta #Challenge`;

    return {
      message,
      url: challenge.shareableUrl,
      title: challenge.title,
      platforms: await Promise.all(
        this.platforms.map(async (platform) => ({
          ...platform,
          available: await this.isPlatformAvailable(platform.id),
        }))
      ),
    };
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setString(text);
      Alert.alert('Success', 'Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }

  /**
   * Generate social media preview content for challenge
   */
  static generateChallengePreview(challenge: {
    title: string;
    description: string;
    currentAmount: number;
    goalAmount: number;
    analytics: { views: number; shares: number; totalTips: number };
  }) {
    const progressPercent = ((challenge.currentAmount / challenge.goalAmount) * 100).toFixed(0);
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(challenge.currentAmount);

    return {
      title: `${challenge.title} - ${progressPercent}% Complete!`,
      description: `${challenge.description}\n\n💰 Raised: ${formattedAmount}\n👁️ ${challenge.analytics.views} views\n🔄 ${challenge.analytics.shares} shares\n🎁 ${challenge.analytics.totalTips} tips\n\n#Givta #Challenge`,
      hashtags: ['Givta', 'Challenge', 'TipChallenge', 'ViralChallenge'],
    };
  }
}

// Export default service instance
export const socialSharingService = SocialSharingService;
