#!/usr/bin/env node

/**
 * Populate Application Notifications Collection
 * This script adds sample application notifications to Firestore
 *
 * USAGE:
 * 1. Set your Firebase environment variables (use the same ones from your app):
 *    export EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
 *    export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
 *    export EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
 *    export EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
 *    export EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
 *    export EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
 *
 * 2. Run the script: node populate-notifications.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp
} = require('firebase/firestore');

// Use the same Firebase configuration from the app's config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDvssOJOXt7QbS77XUUxUhGjH-TmnKVjjg",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "givta-94cb8.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "givta-94cb8",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "givta-94cb8.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "740641129167",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:740641129167:web:c789945191a72f0832edba",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DEVEXAMPLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample application notifications
const sampleNotifications = [
  {
    id: 'promo_double_bonus',
    title: '🎉 Double Bonus This Week!',
    message: 'Get 2x rewards on all tips this weekend! Support your favorite creators and earn extra.',
    type: 'promo',
    priority: 10,
    isActive: true,
    isVisible: true,
    displayOrder: 1,
    target: 'all',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin'
  },
  {
    id: 'promo_kyc_verification',
    title: '⚡ Verify Your Account',
    message: 'Complete KYC verification to unlock premium features and higher daily limits.',
    type: 'warning',
    priority: 8,
    isActive: true,
    isVisible: true,
    displayOrder: 2,
    target: 'not_verified',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin'
  },
  {
    id: 'promo_weekly_challenge',
    title: '🎯 Weekly Challenge Active!',
    message: 'Top 3 tippers this week get free premium features. Check your ranking in Rewards!',
    type: 'success',
    priority: 6,
    isActive: true,
    isVisible: true,
    displayOrder: 3,
    target: 'finished_kyc',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin'
  },
  {
    id: 'info_maintenance_schedule',
    title: '🔧 Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight 2-4 AM. App may be temporarily unavailable.',
    type: 'info',
    priority: 9,
    isActive: true,
    isVisible: true,
    displayOrder: 4,
    target: 'all',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin'
  },
  {
    id: 'promo_referral_boost',
    title: '🚀 Referral Bonus Increased!',
    message: 'Earn ₦500 for each friend you refer this month. Limited time offer!',
    type: 'promo',
    priority: 7,
    isActive: true,
    isVisible: true,
    displayOrder: 5,
    target: 'all',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin'
  }
];

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field =>
    !firebaseConfig[field] || firebaseConfig[field].includes('your-')
  );

  if (missingFields.length > 0) {
    console.error('❌ Firebase configuration is not properly set!');
    console.error('Missing or placeholder values for:', missingFields.join(', '));
    return false;
  }
  return true;
}

// Populate notifications
async function populateNotifications() {
  console.log('🚀 Starting population of application notifications...\n');

  // Validate configuration first
  if (!validateFirebaseConfig()) {
    process.exit(1);
  }

  try {
    console.log('📝 Creating sample application notifications...');

    for (let i = 0; i < sampleNotifications.length; i++) {
      const notification = sampleNotifications[i];
      try {
        await setDoc(doc(db, 'applicationNotifications', notification.id), notification);
        console.log(`✅ Created notification: ${notification.id} - ${notification.title}`);
      } catch (error) {
        console.error(`❌ Failed to create notification ${notification.title}:`, error.message);
      }
    }

    console.log('\n🎉 Successfully populated application notifications!');
    console.log('\n📋 Notifications Added:');
    sampleNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} (${notif.type}) - Target: ${notif.target}`);
    });

    console.log('\n💡 These notifications will now display in the wallet screen!');
    console.log('   • Single notification: Shows as a static banner');
    console.log('   • Multiple notifications: Auto-scroll every 5 seconds');

  } catch (error) {
    console.error('❌ Error populating notifications:', error);
    process.exit(1);
  }
}

// Run the population
if (require.main === module) {
  populateNotifications()
    .then(() => {
      console.log('\n✨ Population complete! Your notifications are ready to display.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateNotifications };
