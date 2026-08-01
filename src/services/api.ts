import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  emailVerified: boolean;
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  referralCode?: string;
  username?: string;
}

export interface WalletBalance {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTipsSent: number;
  totalTipsReceived: number;
  totalReferralEarnings: number;
  availableBalance: number;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'tip_sent' | 'tip_received' | 'referral_bonus' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  recipientId?: string;
  senderId?: string;
  currency: string;
  fee?: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface UserPreferences {
  notifications: boolean;
  language: string;
  currency: string;
  theme: string;
}

export interface WithdrawalLimits {
  minimumAmount: number;
  maximumAmount: number;
  dailyLimit: number;
  remainingDailyLimit: number;
  feePercentage: number;
  feeDescription: string;
}

export interface WalletStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTipsSent: number;
  totalTipsReceived: number;
  totalReferralEarnings: number;
  averageTransactionAmount: number;
  largestTransaction: number;
  monthlyStats: {
    deposits: number;
    withdrawals: number;
    tips: number;
  };
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  bonus: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    // Use the centralized config for the API base URL
    this.baseURL = apiConfig.baseURL;
  }

  private async getFirebaseToken(): Promise<string | null> {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        // This will automatically refresh the token if needed
        return await user.getIdToken();
      }

      return null;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Get fresh Firebase ID token for each request
      const firebaseToken = await this.getFirebaseToken();
      if (firebaseToken) {
        headers.Authorization = `Bearer ${firebaseToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const raw = await response.json();

      // Check if token expired (401) and retry once with fresh token
      if (response.status === 401 && retryCount === 0) {
        console.log('Token expired, refreshing and retrying...');
        const freshToken = await this.getFirebaseToken(); // Force refresh
        if (freshToken) {
          // Retry the request with refreshed token
          return this.request(endpoint, options, retryCount + 1);
        }
      }

      // Normalize server envelope { success, message, data }
      if (raw && typeof raw === 'object' && ('success' in raw || 'data' in raw)) {
        const envelope = raw as { success?: boolean; data?: any; message?: string; error?: string };
        if (!response.ok || envelope.success === false) {
          return {
            success: false,
            error: envelope.message || envelope.error || `HTTP ${response.status}`,
          };
        }
        return {
          success: true,
          data: (envelope.data ?? raw) as T,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: (raw && (raw.message || raw.error)) || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: raw as T,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }



  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>> {
    const response = await this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response as ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>;
  }

  async register(userData: {
    email: string;
    password: string;
    displayName?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>> {
    const response = await this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response as ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile');
  }

  // Wallet
  async getWalletBalance(): Promise<ApiResponse<WalletBalance>> {
    return this.request<WalletBalance>(`/wallets/balance`);
  }

  async getWalletStats(): Promise<ApiResponse<WalletStats>> {
    return this.request<WalletStats>(`/wallets/stats`);
  }

  async getTransactions(limit = 20, offset = 0): Promise<ApiResponse<{
    transactions: Transaction[];
    total: number;
  }>> {
    return this.request<{
      transactions: Transaction[];
      total: number;
    }>(`/wallets/transactions?limit=${limit}&offset=${offset}`);
  }

  async withdrawFunds(amount: number, accountNumber: string, bankCode: string, accountName: string, description?: string): Promise<ApiResponse<{
    transactionId: string;
    newBalance: number;
    amount: number;
    fee: number;
    netAmount: number;
  }>> {
    return this.request<{
      transactionId: string;
      newBalance: number;
      amount: number;
      fee: number;
      netAmount: number;
    }>(`/wallets/withdraw`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        accountNumber,
        bankCode,
        accountName,
        description
      }),
    });
  }

  async getWithdrawalLimits(): Promise<ApiResponse<WithdrawalLimits>> {
    return this.request<WithdrawalLimits>(`/wallets/withdrawal-limits`);
  }

  // Legacy wallet methods for backward compatibility
  async getWallet(): Promise<ApiResponse<{ balance: number; totalEarnings: number }>> {
    const response = await this.getWalletBalance();
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          balance: response.data.balance,
          totalEarnings: response.data.totalReferralEarnings
        }
      };
    }
    return response as any;
  }

  async deposit(amount: number, email: string): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    return this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>(`/payments/initialize`, {
      method: 'POST',
      body: JSON.stringify({ amount, email }),
    });
  }

  async withdraw(amount: number, bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }): Promise<ApiResponse<{
    withdrawalId: string;
    netAmount: number;
    fee: number;
  }>> {
    if (!bankDetails) {
      return {
        success: false,
        error: 'Bank details are required'
      };
    }

    const response = await this.withdrawFunds(amount, bankDetails.accountNumber, bankDetails.bankCode, bankDetails.accountName);

    // Transform response to match legacy interface
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          withdrawalId: response.data.transactionId,
          netAmount: response.data.netAmount,
          fee: response.data.fee
        }
      };
    }

    return response as any;
  }

  // Tips
  async sendTip(recipientId: string, amount: number, message: string): Promise<ApiResponse<{
    transactionId: string;
    newBalance: number;
  }>> {
    return this.request<{
      transactionId: string;
      newBalance: number;
    }>('/tips/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, amount, message }),
    });
  }

  async getTipsSent(limit = 20, offset = 0): Promise<ApiResponse<{
    tips: Transaction[];
    total: number;
  }>> {
    return this.request<{
      tips: Transaction[];
      total: number;
    }>(`/tips/sent?limit=${limit}&offset=${offset}`);
  }

  async getTipsReceived(limit = 20, offset = 0): Promise<ApiResponse<{
    tips: Transaction[];
    total: number;
  }>> {
    return this.request<{
      tips: Transaction[];
      total: number;
    }>(`/tips/received?limit=${limit}&offset=${offset}`);
  }

  async getTipStats(): Promise<ApiResponse<{
    totalTipsSent: number;
    totalTipsReceived: number;
    totalAmountSent: number;
    totalAmountReceived: number;
    totalFeesPaid: number;
    averageTipSent: number;
    averageTipReceived: number;
    largestTipSent: number;
    largestTipReceived: number;
    monthlyStats: {
      sent: number;
      received: number;
    };
  }>> {
    return this.request<{
      totalTipsSent: number;
      totalTipsReceived: number;
      totalAmountSent: number;
      totalAmountReceived: number;
      totalFeesPaid: number;
      averageTipSent: number;
      averageTipReceived: number;
      largestTipSent: number;
      largestTipReceived: number;
      monthlyStats: {
        sent: number;
        received: number;
      };
    }>('/tips/stats');
  }

  // Tip Links
  async generateTipLink(amount: number, message?: string, expiresIn?: number): Promise<ApiResponse<{
    tipLinkId: string;
    shareableUrl: string;
    amount: number;
    message: string;
    expiresAt: string;
    creator: {
      name: string;
      username: string;
    };
  }>> {
    return this.request<{
      tipLinkId: string;
      shareableUrl: string;
      amount: number;
      message: string;
      expiresAt: string;
      creator: {
        name: string;
        username: string;
      };
    }>('/tips/generate-link', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        message,
        expiresIn
      }),
    });
  }

  async getTipLink(tipLinkId: string): Promise<ApiResponse<{
    tipLinkId: string;
    amount: number;
    message: string;
    expiresAt: string;
    usageCount: number;
    totalReceived: number;
    creator: {
      name: string;
      username: string;
    };
  }>> {
    return this.request<{
      tipLinkId: string;
      amount: number;
      message: string;
      expiresAt: string;
      usageCount: number;
      totalReceived: number;
      creator: {
        name: string;
        username: string;
      };
    }>(`/tips/link/${tipLinkId}`);
  }

  async sendTipViaLink(tipLinkId: string, amount: number, tipperName?: string, tipperEmail?: string, paymentMethod?: string): Promise<ApiResponse<{
    tipId: string;
    amount: number;
    fee: number;
    netAmount: number;
    tipLinkId: string;
    creatorReceived: number;
  }>> {
    return this.request<{
      tipId: string;
      amount: number;
      fee: number;
      netAmount: number;
      tipLinkId: string;
      creatorReceived: number;
    }>(`/tips/link/${tipLinkId}/send`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        tipperName,
        tipperEmail,
        paymentMethod: paymentMethod || 'external'
      }),
    });
  }

  async getUserTipLinks(limit = 20, offset = 0): Promise<ApiResponse<{
    tipLinks: Array<{
      id: string;
      shareableUrl: string;
      amount: number;
      message: string;
      status: string;
      expiresAt: string;
      usageCount: number;
      totalReceived: number;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
  }>> {
    return this.request<{
      tipLinks: Array<{
        id: string;
        shareableUrl: string;
        amount: number;
        message: string;
        status: string;
        expiresAt: string;
        usageCount: number;
        totalReceived: number;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
    }>(`/tips/links?limit=${limit}&offset=${offset}`);
  }

  async deactivateTipLink(tipLinkId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tips/link/${tipLinkId}/deactivate`, {
      method: 'PUT',
    });
  }

  // User Search for Tipping
  async searchUsersForTipping(query: string): Promise<ApiResponse<Array<{
    id: string;
    username: string;
    displayName: string;
    email?: string;
    phoneNumber?: string;
    type: 'username' | 'phone' | 'referral';
  }>>> {
    return this.request<Array<{
      id: string;
      username: string;
      displayName: string;
      email?: string;
      phoneNumber?: string;
      type: 'username' | 'phone' | 'referral';
    }>>(`/tips/search?q=${encodeURIComponent(query)}`);
  }

  // Get User by Tipping Identifier
  async getUserByTippingIdentifier(identifier: string): Promise<ApiResponse<{
    userId: string;
    name: string;
    username?: string;
    phoneNumber?: string;
    walletBalance: number;
  }>> {
    return this.request<{
      userId: string;
      name: string;
      username?: string;
      phoneNumber?: string;
      walletBalance: number;
    }>(`/tips/user/${encodeURIComponent(identifier)}`);
  }

  // Legacy Tipping Links (for backward compatibility)
  async getUserByTippingIdentifierLegacy(identifier: string): Promise<ApiResponse<{
    userId: string;
    name: string;
    walletBalance: number;
  }>> {
    return this.request<{
      userId: string;
      name: string;
      walletBalance: number;
    }>(`/tips/tip/${identifier}`);
  }

  async sendTipViaLinkLegacy(receiverIdentifier: string, amount: number, paymentMethod?: string): Promise<ApiResponse<{
    tipId: string;
    amount: number;
    receiverId: string;
    receiverName: string;
  }>> {
    return this.request<{
      tipId: string;
      amount: number;
      receiverId: string;
      receiverName: string;
    }>('/tip/link', {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'anonymous', // For external tippers
        receiverIdentifier: receiverIdentifier,
        amount: amount,
        paymentMethod: paymentMethod || 'external'
      }),
    });
  }

  // Referrals
  async getReferralStats(): Promise<ApiResponse<{
    totalEarnings: number;
    totalReferrals: number;
    referralCode: string;
    levelStats: {
      level: number;
      count: number;
      earnings: number;
    }[];
  }>> {
    return this.request<{
      totalEarnings: number;
      totalReferrals: number;
      referralCode: string;
      levelStats: {
        level: number;
        count: number;
        earnings: number;
      }[];
    }>('/referrals/stats');
  }

  async getReferralCode(): Promise<ApiResponse<{ code: string }>> {
    return this.request<{ code: string }>('/referrals/code');
  }

  async getReferrals(limit = 50): Promise<ApiResponse<Referral[]>> {
    return this.request<Referral[]>(`/referrals?limit=${limit}`);
  }

  // Shared payment gateway helpers
  async initializePayment(amount: number, email: string): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    return this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount, email }),
    });
  }

  async verifyPayment(reference: string): Promise<ApiResponse<{
    status: string;
    transaction: Transaction;
  }>> {
    return this.request<{
      status: string;
      transaction: Transaction;
    }>(`/payments/verify/${reference}`);
  }

  // Notifications
  async getNotifications(limit = 20): Promise<ApiResponse<{
    notifications: {
      id: string;
      title: string;
      message: string;
      type: string;
      read: boolean;
      createdAt: string;
    }[];
    unreadCount: number;
  }>> {
    return this.request<{
      notifications: {
        id: string;
        title: string;
        message: string;
        type: string;
        read: boolean;
        createdAt: string;
      }[];
      unreadCount: number;
    }>(`/notifications?limit=${limit}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/read-all`, {
      method: 'PUT',
    });
  }

  // Register device token with backend for push notifications
  async registerDeviceToken(deviceToken: string, platform: string = 'mobile'): Promise<ApiResponse<void>> {
    return this.request<void>(`/auth/device`, {
      method: 'POST',
      body: JSON.stringify({ deviceToken, platform }),
    });
  }

  // User Profile Management
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile');
  }

  async updateUserProfile(updates: {
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
  }): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changeUsername(newUsername: string, password: string): Promise<ApiResponse<{ username: string }>> {
    return this.request<{ username: string }>('/users/change-username', {
      method: 'PUT',
      body: JSON.stringify({ newUsername, password }),
    });
  }

  async changeEmail(newEmail: string, password: string): Promise<ApiResponse<{
    email: string;
    emailVerified: boolean;
  }>> {
    return this.request<{
      email: string;
      emailVerified: boolean;
    }>('/users/change-email', {
      method: 'PUT',
      body: JSON.stringify({ newEmail, password }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deactivateAccount(password: string, reason?: string): Promise<ApiResponse<void>> {
    return this.request<void>('/users/deactivate', {
      method: 'PUT',
      body: JSON.stringify({ password, reason }),
    });
  }

  // User Preferences
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>('/users/preferences');
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Legacy profile methods for backward compatibility
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async uploadAvatar(imageUri: string): Promise<ApiResponse<{ photoURL: string }>> {
    // TODO: Implement file upload
    return this.request<{ photoURL: string }>('/user/avatar', {
      method: 'POST',
      body: JSON.stringify({ imageUri }),
    });
  }

  // KYC Management
  async submitKYC(documents: {
    idCard?: string;
    passport?: string;
    utilityBill?: string;
    selfie?: string;
  }): Promise<ApiResponse<{ submissionId: string }>> {
    const formData = new FormData();

    // Add documents to form data
    if (documents.idCard) {
      formData.append('idCard', {
        uri: documents.idCard,
        type: 'image/jpeg',
        name: 'idCard.jpg'
      } as any);
    }

    if (documents.passport) {
      formData.append('passport', {
        uri: documents.passport,
        type: 'image/jpeg',
        name: 'passport.jpg'
      } as any);
    }

    if (documents.utilityBill) {
      formData.append('utilityBill', {
        uri: documents.utilityBill,
        type: 'image/jpeg',
        name: 'utilityBill.jpg'
      } as any);
    }

    if (documents.selfie) {
      formData.append('selfie', {
        uri: documents.selfie,
        type: 'image/jpeg',
        name: 'selfie.jpg'
      } as any);
    }

    return this.request<{ submissionId: string }>('/kyc/submit', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getKYCStatus(): Promise<ApiResponse<{
    status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    submission?: any;
    requirements: string[];
  }>> {
    return this.request<{
      status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
      submission?: any;
      requirements: string[];
    }>('/kyc/status');
  }

  async checkKYCEligibility(): Promise<ApiResponse<{
    eligible: boolean;
    currentStatus: string;
    reason: string;
  }>> {
    return this.request<{
      eligible: boolean;
      currentStatus: string;
      reason: string;
    }>('/kyc/eligibility');
  }

  async getKYCRequirements(): Promise<ApiResponse<{
    requirements: string[];
    currentStatus: string;
  }>> {
    return this.request<{
      requirements: string[];
      currentStatus: string;
    }>('/kyc/requirements');
  }

  // Bank Operations
  async getBanks(): Promise<ApiResponse<Array<{
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string | null;
    pay_with_bank: boolean;
    active: boolean;
    country: string;
    currency: string;
    type: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  }>>> {
    return this.request<Array<{
      name: string;
      slug: string;
      code: string;
      longcode: string;
      gateway: string | null;
      pay_with_bank: boolean;
      active: boolean;
      country: string;
      currency: string;
      type: string;
      id: number;
      createdAt: string;
      updatedAt: string;
    }>>('/payments/banks');
  }

  async validateBankAccount(accountNumber: string, bankCode: string): Promise<ApiResponse<{
    account_number: string;
    account_name: string;
    bank_id: number;
  }>> {
    return this.request<{
      account_number: string;
      account_name: string;
      bank_id: number;
    }>('/payments/verify-bank-account', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    });
  }
  // Analytics
  async getAnalyticsDashboard(): Promise<ApiResponse<{
    user: {
      name: string;
      username: string;
      joinDate: string;
      kycStatus: string;
      referralCode: string;
    };
    wallet: {
      balance: number;
      currency: string;
    };
    summary: {
      thisMonth: {
        spending: number;
        earnings: number;
        transactions: number;
        netFlow: number;
      };
      categories: Record<string, number>;
      recentActivity: Array<{
        id: string;
        type: string;
        amount: number;
        description: string;
        date: string;
        status: string;
      }>;
    };
    referrals: {
      totalReferrals: number;
      totalEarnings: number;
      levelBreakdown: Array<{
        level: number;
        count: number;
        earnings: number;
      }>;
    };
    goals: {
      monthlyTarget: number;
      currentProgress: number;
      percentageComplete: number;
    };
    insights: {
      topCategory: string;
      avgTransaction: number;
      mostActiveDay: string;
      savingsRate: number;
    };
  }>> {
    return this.request<{
      user: {
        name: string;
        username: string;
        joinDate: string;
        kycStatus: string;
        referralCode: string;
      };
      wallet: {
        balance: number;
        currency: string;
      };
      summary: {
        thisMonth: {
          spending: number;
          earnings: number;
          transactions: number;
          netFlow: number;
        };
        categories: Record<string, number>;
        recentActivity: Array<{
          id: string;
          type: string;
          amount: number;
          description: string;
          date: string;
          status: string;
        }>;
      };
      referrals: {
        totalReferrals: number;
        totalEarnings: number;
        levelBreakdown: Array<{
          level: number;
          count: number;
          earnings: number;
        }>;
      };
      goals: {
        monthlyTarget: number;
        currentProgress: number;
        percentageComplete: number;
      };
      insights: {
        topCategory: string;
        avgTransaction: number;
        mostActiveDay: string;
        savingsRate: number;
      };
    }>('/analytics/dashboard');
  }

  async getAnalytics(period = '30d'): Promise<ApiResponse<{
    totalSpent: number;
    totalEarned: number;
    transactionCount: number;
    topCategories: {
      category: string;
      amount: number;
      count: number;
    }[];
  }>> {
    return this.request<{
      totalSpent: number;
      totalEarned: number;
      transactionCount: number;
      topCategories: {
        category: string;
        amount: number;
        count: number;
      }[];
    }>(`/analytics?period=${period}`);
  }

  // Weekly Rankings (for Givta Rewards)
  async getWeeklyRankings(type: 'tippers' | 'tipped'): Promise<ApiResponse<{
    type: string;
    weekStart: string;
    rankings: Array<{
      rank: number;
      username: string;
      userId: string;
      amount: number;
      displayName: string;
    }>;
  }>> {
    return this.request<{
      type: string;
      weekStart: string;
      rankings: Array<{
        rank: number;
        username: string;
        userId: string;
        amount: number;
        displayName: string;
      }>;
    }>(`/analytics/rankings?type=${type}`);
  }

  // Two-Factor Authentication
  async getTwoFactorSetup(): Promise<ApiResponse<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }>> {
    return this.request<{
      secret: string;
      qrCodeUrl: string;
      backupCodes: string[];
    }>('/twofactor/setup');
  }

  async enableTwoFactor(token: string, secret: string): Promise<ApiResponse<void>> {
    return this.request<void>('/twofactor/enable', {
      method: 'POST',
      body: JSON.stringify({ token, secret }),
    });
  }

  async verifyTwoFactor(token: string): Promise<ApiResponse<{
    verified: boolean;
  }>> {
    return this.request<{
      verified: boolean;
    }>('/twofactor/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async disableTwoFactor(): Promise<ApiResponse<void>> {
    return this.request<void>('/twofactor/disable', {
      method: 'POST',
    });
  }

  async getTwoFactorStatus(): Promise<ApiResponse<{
    enabled: boolean;
  }>> {
    return this.request<{
      enabled: boolean;
    }>('/twofactor/status');
  }

  async regenerateTwoFactorBackupCodes(): Promise<ApiResponse<{
    backupCodes: string[];
  }>> {
    return this.request<{
      backupCodes: string[];
    }>('/twofactor/backup-codes', {
      method: 'POST',
    });
  }

  // Feedback
  async submitFeedback(feedback: {
    rating: number;
    category: string;
    subject?: string;
    message: string;
    deviceInfo?: any;
  }): Promise<ApiResponse<{
    feedbackId: string;
    rating: number;
    category: string;
  }>> {
    return this.request<{
      feedbackId: string;
      rating: number;
      category: string;
    }>('/users/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // Referral Withdrawal
  async withdrawReferralEarnings(amount: number, bankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }): Promise<ApiResponse<{
    withdrawalId: string;
    netAmount: number;
    fee: number;
  }>> {
    return this.request<{
      withdrawalId: string;
      netAmount: number;
      fee: number;
    }>('/referrals/current/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        accountNumber: bankDetails.accountNumber,
        bankCode: bankDetails.bankCode,
        accountName: bankDetails.accountName,
      }),
    });
  }

  // Referral History
  async getReferralHistory(limit = 50, offset = 0): Promise<ApiResponse<{
    activities: {
      id: string;
      type: string;
      userId: string;
      userName: string;
      bonus: number;
      level: number;
      date: string;
      status: string;
    }[];
    total: number;
  }>> {
    return this.request<{
      activities: {
        id: string;
        type: string;
        userId: string;
        userName: string;
        bonus: number;
        level: number;
        date: string;
        status: string;
      }[];
      total: number;
    }>(`/referrals/history?limit=${limit}&offset=${offset}`);
  }

  // Referral Support/FAQ
  async getReferralSupport(): Promise<ApiResponse<{
    faq: {
      question: string;
      answer: string;
    }[];
    contact: {
      email: string;
      whatsapp: string;
      hours: string;
    };
    videoTutorials: {
      title: string;
      url: string;
      duration: string;
    }[];
  }>> {
    return this.request<{
      faq: {
        question: string;
        answer: string;
      }[];
      contact: {
        email: string;
        whatsapp: string;
        hours: string;
      };
      videoTutorials: {
        title: string;
        url: string;
        duration: string;
      }[];
    }>('/referrals/support');
  }

  // Generate QR Code
  async generateReferralQR(size = '200x200'): Promise<ApiResponse<{
    referralUrl: string;
    referralCode: string;
    qrData: string;
    size: string;
  }>> {
    return this.request<{
      referralUrl: string;
      referralCode: string;
      qrData: string;
      size: string;
    }>(`/referrals/qr?size=${size}`);
  }
}

export const apiService = new ApiService();
export default apiService;
