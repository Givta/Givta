 // Database Collections for Givta App
// These files define the complete Firestore database schema

export { userCollection, UserCollection } from './users';
export type { User } from './users';

export { walletCollection, WalletCollection } from './wallets';
export type { Wallet } from './wallets';

export { transactionCollection, TransactionCollection } from './transactions';
export type { Transaction } from './transactions';

export { referralCollection, ReferralCollection } from './referrals';
export type { Referral } from './referrals';

export { notificationCollection, NotificationCollection } from './notifications';
export type { Notification } from './notifications';

export { tipCollection, TipCollection } from './tips';
export type { Tip } from './tips';

export { kycCollection, KYCCollection } from './kyc';
export type { KYC } from './kyc';

export { whatsappSessionCollection, WhatsAppSessionCollection } from './whatsappSessions';
export type { WhatsAppSession } from './whatsappSessions';

export { FeedbackCollection } from './feedback';
export type { Feedback } from './feedback';

export { ExternalTipsCollection } from './externalTips';
export type { ExternalTip } from './externalTips';

export { TipLinksCollection } from './tipLinks';
export type { TipLink } from './tipLinks';

export { TwoFactorSetupCollection } from './twoFactorSetup';
export type { TwoFactorSetup } from './twoFactorSetup';

export { TwoFactorBackupCodesCollection } from './twoFactorBackupCodes';
export type { TwoFactorBackupCode } from './twoFactorBackupCodes';

// Challenge collections
export {
  ChallengesCollection,
  ChallengeTipsCollection
} from './challenges';
export type {
  ChallengeType,
  Challenge,
  ChallengeParticipant,
  ChallengeTip
} from './challenges';

export { WebhookLogsCollection } from './webhookLogs';
export type { WebhookLog } from './webhookLogs';

// Database Schema Overview:
//
// 1. users - User profiles and authentication data
// 2. wallets - User wallet balances and transaction summaries
// 3. transactions - Complete transaction history and audit trail
// 4. referrals - 3-level referral system with bonuses
// 5. notifications - Push notifications and in-app messages
// 6. tips - Tipping system with fee calculations
// 7. kyc - KYC document uploads and verification
// 8. whatsapp_sessions - WhatsApp bot session management
// 9. feedback - User feedback and ratings system
// 10. externalTips - Public tipping transactions
// 11. tipLinks - Shareable tip link management
// 12. twoFactorSetup - 2FA configuration and management
// 13. twoFactorBackupCodes - 2FA backup codes storage
// 14. webhookLogs - Payment webhook processing logs
//
// Key Features:
// - Full TypeScript support with proper interfaces
// - Comprehensive CRUD operations for all collections
// - Advanced querying with filtering and pagination
// - Real-time data synchronization capabilities
// - Admin functions for system management
// - Automatic date handling and conversion
// - Error handling and data validation
//
// Usage:
// import { userCollection, walletCollection } from './collections';
// const user = await userCollection.getById('userId');
// const wallet = await walletCollection.getByUserId('userId');
