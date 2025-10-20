import * as Linking from 'expo-linking';

// Base URLs for deep links
const BASE_URL = 'givta://';
const WEB_BASE_URL = 'https://givta.app';
const WEB_BASE_URL_WWW = 'https://www.givta.app';

/**
 * Generate referral link (deep link)
 */
export const generateReferralLink = (referrerId: string): string => {
  return `${BASE_URL}ref/${referrerId}`;
};

/**
 * Generate referral web fallback link
 */
export const generateReferralWebLink = (referrerId: string): string => {
  return `${WEB_BASE_URL}/ref/${referrerId}`;
};

/**
 * Generate tip link (deep link)
 */
export const generateTipLink = (userId: string): string => {
  return `${BASE_URL}tip/${userId}`;
};

/**
 * Generate tip web fallback link
 */
export const generateTipWebLink = (userId: string): string => {
  return `${WEB_BASE_URL}/tip/${userId}`;
};

/**
 * Generate public tip link (external tipping)
 */
export const generatePublicTipLink = (tipLinkId: string): string => {
  return `${WEB_BASE_URL}/tip-link/${tipLinkId}`;
};

/**
 * Generate external tip link (anonymous tipping)
 */
export const generateExternalTipLink = (tipLinkId: string): string => {
  return `${WEB_BASE_URL}/public-tip/${tipLinkId}`;
};

/**
 * Generate wallet link
 */
export const generateWalletLink = (): string => {
  return `${BASE_URL}wallet`;
};

/**
 * Generate payment link
 */
export const generatePaymentLink = (type: 'deposit' | 'withdraw' = 'deposit'): string => {
  return `${BASE_URL}payment/${type}`;
};

/**
 * Generate profile link
 */
export const generateProfileLink = (): string => {
  return `${BASE_URL}profile`;
};

/**
 * Generate profile web link
 */
export const generateProfileWebLink = (): string => {
  return `${WEB_BASE_URL}/profile`;
};

/**
 * Generate rewards link
 */
export const generateRewardsLink = (): string => {
  return `${BASE_URL}rewards`;
};

/**
 * Generate rewards web link
 */
export const generateRewardsWebLink = (): string => {
  return `${WEB_BASE_URL}/rewards`;
};

/**
 * Generate analytics link
 */
export const generateAnalyticsLink = (): string => {
  return `${BASE_URL}analytics`;
};

/**
 * Generate security link
 */
export const generateSecurityLink = (): string => {
  return `${BASE_URL}security`;
};

/**
 * Open a deep link URL
 */
export const openDeepLink = async (url: string): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('Cannot open deep link:', url);
    }
  } catch (error) {
    console.error('Error opening deep link:', error);
  }
};

/**
 * Share referral link with WhatsApp/SMS
 */
export const shareReferralLink = async (
  referrerId: string,
  referrerName: string,
  message: string = 'Join Givta and start earning rewards!'
): Promise<void> => {
  const referralLink = generateReferralWebLink(referrerId);

  const shareMessage = `${message}\n\nJoin using my link: ${referralLink}\n\n-#${referrerName}`;

  // Open share sheet with the referral link
  if (await Linking.canOpenURL('sms:')) {
    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(shareMessage)}`);
    } catch {
      // Fallback to clipboard
      console.log('Shared referral link:', shareMessage);
    }
  }
};

/**
 * Share tip link for users
 */
export const shareTipLink = async (
  userId: string,
  displayName: string,
  message: string = 'Support me on Givta!'
): Promise<void> => {
  const tipLink = generateTipWebLink(userId);

  const shareMessage = `${message}\n\nSend me a tip: ${tipLink}\n\n-#${displayName}`;

  // Open share sheet
  if (await Linking.canOpenURL('sms:')) {
    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(shareMessage)}`);
    } catch {
      console.log('Shared tip link:', shareMessage);
    }
  }
};

/**
 * Share public tip link
 */
export const sharePublicTipLink = async (
  tipLinkId: string,
  title: string,
  message: string = 'Check out this tip link!'
): Promise<void> => {
  const publicTipLink = generatePublicTipLink(tipLinkId);

  const shareMessage = `${title}\n\nSupport their journey: ${publicTipLink}\n\n${message}`;

  // Open share sheet
  if (await Linking.canOpenURL('sms:')) {
    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(shareMessage)}`);
    } catch {
      console.log('Shared public tip link:', shareMessage);
    }
  }
};

/**
 * Parse incoming deep link parameters
 */
export const parseDeepLinkParams = (url: string) => {
  try {
    const { path } = Linking.parse(url);

    if (path?.startsWith('/ref/')) {
      const [, referrerId] = path.split('/');
      return {
        type: 'referral',
        referrerId,
      };
    }

    if (path?.startsWith('/tip/') && !path.includes('link')) {
      const [, userId] = path.split('/');
      return {
        type: 'tip',
        userId,
      };
    }

    if (path?.startsWith('/tip-link/')) {
      const [, tipLinkId] = path.split('/');
      return {
        type: 'tip-link',
        tipLinkId,
      };
    }

    if (path?.startsWith('/public-tip/')) {
      const [, tipLinkId] = path.split('/');
      return {
        type: 'public-tip',
        tipLinkId,
      };
    }

    if (path?.startsWith('/wallet')) {
      return {
        type: 'wallet',
      };
    }

    if (path?.startsWith('/payment/')) {
      const [, type] = path.split('/');
      return {
        type: 'payment',
        paymentType: type,
      };
    }

    if (path?.startsWith('/profile')) {
      return {
        type: 'profile',
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Handle different types of deep links
 */
export const handleDeepLink = (params: any): { screen: string; params?: any } | null => {
  switch (params?.type) {
    case 'referral':
      return {
        screen: 'ReferralLanding',
        params: {
          referrerId: params.referrerId,
        },
      };

    case 'tip':
      return {
        screen: 'TipScreen',
        params: {
          userId: params.userId,
        },
      };

    case 'tip-link':
    case 'public-tip':
      return {
        screen: 'ExternalTipScreen',
        params: {
          tipLinkId: params.tipLinkId,
          type: params.type,
        },
      };

    case 'wallet':
      return {
        screen: 'WalletScreen',
      };

    case 'payment':
      return {
        screen: 'PaymentScreen',
        params: {
          paymentType: params.paymentType || 'deposit',
        },
      };

    case 'profile':
      return {
        screen: 'ProfileScreen',
      };

    default:
      return null;
  }
};

/**
 * Universal deep link dispatcher
 */
export const navigateToDeepLink = async (linkType: string, params: any = {}): Promise<void> => {
  switch (linkType) {
    case 'referral':
      const referralUrl = generateReferralLink(params.referrerId);
      await openDeepLink(referralUrl);
      break;

    case 'tip':
      const tipUrl = generateTipLink(params.userId);
      await openDeepLink(tipUrl);
      break;

    case 'tip-link':
      const publicTipUrl = generatePublicTipLink(params.tipLinkId);
      await openDeepLink(publicTipUrl);
      break;

    case 'wallet':
      const walletUrl = generateWalletLink();
      await openDeepLink(walletUrl);
      break;

    case 'payment':
      const paymentUrl = generatePaymentLink(params.type || 'deposit');
      await openDeepLink(paymentUrl);
      break;

    default:
      console.warn('Unknown deep link type:', linkType);
  }
};
