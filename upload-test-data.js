#!/usr/bin/env node

/**
 * Upload Test Data Script for Givta App
 *
 * This script uploads test data to Firestore using Firebase Admin SDK.
 * Run this from a Firebase Functions environment or with proper credentials.
 *
 * Usage:
 * node upload-test-data.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to set up service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: "givta-94cb8",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'givta-94cb8'
  });
}

const db = admin.firestore();

console.log('🔥 Uploading Givta Test Data...\n');

// Sample data for testing
const sampleData = {
  users: {
    testUser1: {
      email: "test1@givta.app",
      displayName: "Test User 1",
      phoneNumber: "+234 813 927 0820",
      emailVerified: true,
      isActive: true,
      referralCode: "TEST123",
      referralLevel: 1,
      totalReferrals: 0,
      totalEarnings: 0,
      preferences: {
        notifications: true,
        language: "en",
        currency: "NGN",
        theme: "light"
      },
      kycStatus: "not_submitted"
    },
    testUser2: {
      email: "test2@givta.app",
      displayName: "Test User 2",
      phoneNumber: "+2341234567891",
      emailVerified: true,
      isActive: true,
      referralCode: "TEST456",
      referredBy: "testUser1",
      referralLevel: 1,
      totalReferrals: 0,
      totalEarnings: 0,
      preferences: {
        notifications: true,
        language: "en",
        currency: "NGN",
        theme: "light"
      },
      kycStatus: "not_submitted"
    }
  },

  wallets: {
    testWallet1: {
      userId: "testUser1",
      balance: 5000,
      totalDeposits: 5000,
      totalWithdrawals: 0,
      totalTipsSent: 0,
      totalTipsReceived: 0,
      totalReferralEarnings: 0,
      currency: "NGN",
      isActive: true
    }
  },

  transactions: {
    testTransaction1: {
      userId: "testUser1",
      type: "deposit",
      amount: 5000,
      status: "completed",
      description: "Initial deposit",
      metadata: {
        reference: "TEST_REF_001"
      }
    }
  },

  referrals: {
    testReferral1: {
      referrerId: "testUser1",
      referredId: "testUser2",
      bonusAmount: 100,
      level: 1,
      status: "active"
    }
  },

  notifications: {
    testNotification1: {
      userId: "testUser1",
      title: "Welcome to Givta!",
      message: "Your account has been created successfully.",
      type: "welcome",
      isRead: false,
      priority: "normal"
    }
  },

  tips: {
    testTip1: {
      senderId: "testUser1",
      recipientId: "testUser2",
      amount: 1000,
      fee: 20,
      netAmount: 980,
      status: "completed",
      message: "Test tip",
      paymentMethod: "wallet"
    }
  }
};

async function uploadCollection(collectionName, data) {
  console.log(`📝 Uploading ${collectionName} collection...`);

  try {
    const batch = db.batch();

    for (const [docId, docData] of Object.entries(data)) {
      const docRef = db.collection(collectionName).doc(docId);
      const dataWithTimestamps = {
        ...docData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, dataWithTimestamps);
      console.log(`   ✅ Prepared ${docId} for upload`);
    }

    await batch.commit();
    console.log(`✅ ${collectionName} collection uploaded successfully\n`);
  } catch (error) {
    console.error(`❌ Error uploading ${collectionName} collection:`, error.message);
    console.log('');
  }
}

async function runUpload() {
  console.log('🚀 Starting test data upload...\n');

  // Check if environment variables are set
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Firebase service account credentials not found!');
    console.log('Please set the following environment variables:');
    console.log('  - FIREBASE_PRIVATE_KEY_ID');
    console.log('  - FIREBASE_PRIVATE_KEY');
    console.log('  - FIREBASE_CLIENT_EMAIL');
    console.log('  - FIREBASE_CLIENT_ID');
    console.log('  - FIREBASE_CLIENT_X509_CERT_URL');
    process.exit(1);
  }

  // Upload each collection
  await uploadCollection('users', sampleData.users);
  await uploadCollection('wallets', sampleData.wallets);
  await uploadCollection('transactions', sampleData.transactions);
  await uploadCollection('referrals', sampleData.referrals);
  await uploadCollection('notifications', sampleData.notifications);
  await uploadCollection('tips', sampleData.tips);

  console.log('🎉 Test data upload completed!');
  console.log('\n📊 Upload Summary:');
  console.log('   - Users: 2 test users uploaded');
  console.log('   - Wallets: 1 test wallet uploaded');
  console.log('   - Transactions: 1 test transaction uploaded');
  console.log('   - Referrals: 1 test referral uploaded');
  console.log('   - Notifications: 1 test notification uploaded');
  console.log('   - Tips: 1 test tip uploaded');

  console.log('\n🔍 Next Steps:');
  console.log('   1. Check Firebase Console to verify data');
  console.log('   2. Test app functionality with test data');
  console.log('   3. Clean up test data when ready');

  console.log('\n✨ Givta collections are now populated with test data!');
}

runUpload().catch(console.error);
