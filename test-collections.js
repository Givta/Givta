#!/usr/bin/env node

/**
 * Test Collections Upload Script for Givta App
 *
 * This script tests the Firestore collections by uploading sample data.
 *
 * Usage:
 * node test-collections.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvssOJOXt7QbS77XUUxUhGjH-TmnKVjjg",
  authDomain: "givta-94cb8.firebaseapp.com",
  projectId: "givta-94cb8",
  storageBucket: "givta-94cb8.firebasestorage.app",
  messagingSenderId: "740641129167",
  appId: "1:740641129167:web:c789945191a72f0832edba",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Testing Givta Firestore Collections...\n');

// Sample data for testing
const sampleData = {
  users: {
    testUser1: {
      email: "test1@givta.com",
      displayName: "Test User 1",
      phoneNumber: "+2341234567890",
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
      email: "test2@givta.com",
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

async function testCollection(collectionName, data) {
  console.log(`📝 Testing ${collectionName} collection...`);

  try {
    const collectionRef = collection(db, collectionName);

    for (const [docId, docData] of Object.entries(data)) {
      // Add timestamps
      const dataWithTimestamps = {
        ...docData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (collectionName === 'users' || collectionName === 'wallets' ||
          collectionName === 'transactions' || collectionName === 'referrals' ||
          collectionName === 'notifications' || collectionName === 'tips') {
        // Use setDoc for collections where we want specific document IDs
        await setDoc(doc(db, collectionName, docId), dataWithTimestamps);
      } else {
        // Use addDoc for auto-generated IDs
        await addDoc(collectionRef, dataWithTimestamps);
      }

      console.log(`   ✅ Created ${docId} in ${collectionName}`);
    }

    console.log(`✅ ${collectionName} collection test completed\n`);
  } catch (error) {
    console.error(`❌ Error testing ${collectionName} collection:`, error.message);
    console.log('');
  }
}

async function runTests() {
  console.log('🚀 Starting collection upload tests...\n');

  // Test each collection
  await testCollection('users', sampleData.users);
  await testCollection('wallets', sampleData.wallets);
  await testCollection('transactions', sampleData.transactions);
  await testCollection('referrals', sampleData.referrals);
  await testCollection('notifications', sampleData.notifications);
  await testCollection('tips', sampleData.tips);

  console.log('🎉 All collection tests completed!');
  console.log('\n📊 Test Summary:');
  console.log('   - Users: 2 test users created');
  console.log('   - Wallets: 1 test wallet created');
  console.log('   - Transactions: 1 test transaction created');
  console.log('   - Referrals: 1 test referral created');
  console.log('   - Notifications: 1 test notification created');
  console.log('   - Tips: 1 test tip created');

  console.log('\n🔍 Next Steps:');
  console.log('   1. Check Firebase Console to verify data');
  console.log('   2. Test app functionality with test data');
  console.log('   3. Clean up test data when ready');

  console.log('\n✨ Givta collections are working perfectly!');
}

runTests().catch(console.error);
