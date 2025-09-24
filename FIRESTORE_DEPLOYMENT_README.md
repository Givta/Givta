# Firestore Collections Deployment Guide

This guide provides step-by-step instructions for deploying the Givta app's Firestore collections to Firebase.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Deployment Files](#deployment-files)
- [Deployment Process](#deployment-process)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

### 1. Firebase CLI Installation
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### 2. Firebase Account & Project
- Firebase account with billing enabled (for production)
- Firebase project created (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

### 3. Node.js Environment
- Node.js 16+ installed
- npm or yarn package manager

## 🚀 Firebase Project Setup

### Step 1: Login to Firebase
```bash
# Login to Firebase (opens browser)
firebase login

# Verify login
firebase projects:list
```

### Step 2: Initialize Firebase Project
```bash
# Navigate to project directory
cd givta

# Initialize Firebase (if not already done)
firebase init

# Select services:
# - Firestore: Yes
# - Hosting: No (optional)
# - Functions: No (optional)
```

### Step 3: Configure Project
```bash
# Set default project (production)
firebase use givta-prod

# For development
firebase use givta-dev

# For staging
firebase use givta-staging
```

## 📁 Deployment Files

The following files are included for deployment:

### Core Files:
- `firestore.rules` - Security rules for all collections
- `firestore.indexes.json` - Database indexes for optimal queries
- `deploy-firestore.js` - Automated deployment script
- `.firebaserc` - Project configuration

### Collection Files:
- `src/collections/users.ts` - User management
- `src/collections/wallets.ts` - Financial balances
- `src/collections/transactions.ts` - Transaction history
- `src/collections/referrals.ts` - Referral system
- `src/collections/notifications.ts` - Push notifications
- `src/collections/tips.ts` - Tipping system

## 🚀 Deployment Process

### Method 1: Automated Deployment (Recommended)

```bash
# Make deployment script executable
chmod +x deploy-firestore.js

# Run deployment script
node deploy-firestore.js
```

### Method 2: Manual Deployment

#### Step 1: Deploy Security Rules
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Expected output:
# ✔ Deploying Firestore security rules...
# ✔ Deploy complete!
```

#### Step 2: Deploy Database Indexes
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Expected output:
# ✔ Deploying Firestore indexes...
# ✔ Deploy complete!
```

#### Step 3: Verify Deployment
```bash
# Check deployed rules
firebase firestore:rules:list

# Check deployed indexes
firebase firestore:indexes:list
```

## 🔍 Verification

### Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Check **Rules** tab - should show deployed rules
5. Check **Indexes** tab - should show deployed indexes

### Test Collections
```bash
# Test with a simple query (requires authentication)
# The app will automatically test collections on first use
```

## 📊 Collections Overview

### 1. Users Collection
```javascript
// Structure
{
  id: string,
  email: string,
  displayName?: string,
  phoneNumber?: string,
  photoURL?: string,
  emailVerified: boolean,
  referralCode: string,
  referredBy?: string,
  totalReferrals: number,
  totalEarnings: number,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Wallets Collection
```javascript
// Structure
{
  id: string,
  userId: string,
  balance: number,
  currency: string,
  totalDeposits: number,
  totalWithdrawals: number,
  totalTipsSent: number,
  totalTipsReceived: number,
  totalReferralEarnings: number,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Transactions Collection
```javascript
// Structure
{
  id: string,
  userId: string,
  type: 'deposit' | 'withdrawal' | 'tip' | 'referral_bonus',
  amount: number,
  description: string,
  status: 'pending' | 'completed' | 'failed',
  reference?: string,
  currency: string,
  fee?: number,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Referrals Collection
```javascript
// Structure
{
  id: string,
  referrerId: string,
  referredId: string,
  level: number,
  bonus: number,
  status: 'pending' | 'completed',
  referralCode: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Notifications Collection
```javascript
// Structure
{
  id: string,
  userId: string,
  title: string,
  message: string,
  type: 'transaction' | 'referral' | 'tip' | 'system',
  read: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Tips Collection
```javascript
// Structure
{
  id: string,
  senderId: string,
  recipientId: string,
  amount: number,
  description: string,
  isAnonymous: boolean,
  status: 'pending' | 'completed' | 'failed',
  currency: string,
  fee: number,
  netAmount: number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Rules Summary

### Access Control:
- **Users**: Can read/write their own data, read others for referrals
- **Wallets**: Users can manage their own wallets
- **Transactions**: Users can create, admins can update
- **Referrals**: Referrers can create, both parties can read
- **Notifications**: Users can manage their own notifications
- **Tips**: Involved parties can read, senders can create

### Rate Limiting:
- Prevents excessive writes from single users
- 1-second minimum interval between writes

## 📈 Performance Optimizations

### Database Indexes:
- **Users**: email, referralCode, referredBy
- **Wallets**: userId + isActive, balance queries
- **Transactions**: userId + createdAt, type filtering, status queries
- **Referrals**: referrerId, referredId, level, status
- **Notifications**: userId + read status, type filtering
- **Tips**: sender/recipient queries, status filtering

### Query Optimization:
- Compound indexes for complex queries
- Proper ordering for pagination
- Efficient filtering and sorting

## 🔧 Troubleshooting

### Common Issues:

#### 1. Deployment Fails
```bash
# Check Firebase project
firebase projects:list

# Verify login
firebase login:list

# Check project configuration
firebase use
```

#### 2. Rules Deployment Error
```bash
# Check syntax
firebase firestore:rules:compile firestore.rules

# Validate rules
firebase firestore:rules:test
```

#### 3. Indexes Deployment Error
```bash
# Check indexes format
firebase firestore:indexes:compile firestore.indexes.json

# List existing indexes
firebase firestore:indexes:list
```

#### 4. Permission Errors
```bash
# Check project permissions
firebase projects:list

# Verify billing is enabled (for production)
# Go to Firebase Console → Project Settings → Usage and billing
```

### Debug Commands:
```bash
# View deployment logs
firebase deploy --debug

# Test specific service
firebase deploy --only firestore

# Rollback deployment
firebase firestore:rules:rollback
```

## 📊 Monitoring & Maintenance

### Firebase Console Monitoring:
1. **Firestore** → **Usage** - Monitor read/write operations
2. **Firestore** → **Indexes** - Monitor index performance
3. **Functions** → **Logs** - Monitor Cloud Functions (if used)
4. **Analytics** → **Dashboard** - Monitor user engagement

### Performance Monitoring:
```bash
# Monitor Firestore performance
firebase firestore:profiles:list

# View usage statistics
firebase firestore:usage:list
```

## 🚀 Production Deployment Checklist

- [ ] Firebase project created with billing enabled
- [ ] Firebase CLI installed and configured
- [ ] Security rules deployed and tested
- [ ] Database indexes deployed
- [ ] Environment variables configured
- [ ] App tested with deployed database
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented

## 📞 Support

For deployment issues:
1. Check [Firebase Documentation](https://firebase.google.com/docs/firestore)
2. Review [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
3. Check Firebase Console for error details
4. Verify all prerequisites are met

---

## 🎉 Success!

Once deployed, your Givta Firestore collections will be:
- ✅ **Secure** - Protected by comprehensive security rules
- ✅ **Optimized** - Indexed for fast queries
- ✅ **Scalable** - Ready for production traffic
- ✅ **Monitored** - Integrated with Firebase monitoring

Your app is now ready for production use! 🚀
