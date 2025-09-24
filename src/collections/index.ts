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
