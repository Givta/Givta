#!/usr/bin/env node

/**
 * Populate New Challenge Collections (v2)
 * This script populates the new Firebase collections with sample data
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
 * 2. Run the script: node populate-new-collections.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp
} = require('firebase/firestore');

// Use the same Firebase configuration from the app's config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection names (v2)
const COLLECTIONS = {
  CHALLENGES: 'challenges_v2',
  CHALLENGE_PARTICIPANTS: 'challenge_participants_v2',
  CHALLENGE_TIPS: 'challenge_tips_v2',
  CHALLENGE_VOTES: 'challenge_votes_v2',
  SPONSORS: 'sponsors_v2'
};

// Sample data
const sampleChallenges = [
  {
    userId: 'demo-user-1',
    type: 'personal',
    title: 'My Fitness Transformation Journey',
    description: 'Join me on my 6-month weight loss journey to lose 20kg',
    category: 'fitness',
    entryFee: 1000,
    currency: 'NGN',
    status: 'active',
    isPublic: true,
    shareableUrl: 'https://givta.ng/personal-challenge/fitness-journey',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    goalAmount: 80000,
    bonusPercentage: 5,
    totalTips: 0,
    totalAmount: 0,
    totalParticipants: 0,
    totalViews: 5,
    totalShares: 2,
    upvotes: 0,
    downvotes: 0,
    hashtags: ['fitness', 'weightloss', 'transformation'],
    isDeleted: false
  },
  {
    userId: 'demo-user-2',
    type: 'competition',
    title: 'Dance Championship 2025',
    description: 'Nigeria\'s biggest dance competition with ₦250,000 prize pool!',
    category: 'entertainment',
    entryFee: 2500,
    currency: 'NGN',
    status: 'active',
    isPublic: true,
    shareableUrl: 'https://givta.ng/competition/dance-2025',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    maxParticipants: 50,
    prizeSplitRatios: { 1: 60, 2: 30, 3: 10 },
    totalTips: 0,
    totalAmount: 0,
    totalParticipants: 0,
    totalViews: 15,
    totalShares: 8,
    upvotes: 0,
    downvotes: 0,
    hashtags: ['dance', 'competition', 'talent'],
    isDeleted: false
  },
  {
    userId: 'demo-user-sponsor',
    sponsorId: 'fitwell-nigeria',
    type: 'sponsored',
    title: 'FitWell Transformation Challenge',
    description: 'Transform your body with premium fitness gear from FitWell Nigeria',
    category: 'fitness',
    entryFee: 0,
    currency: 'NGN',
    sponsorContribution: 200000,
    status: 'active',
    isPublic: true,
    shareableUrl: 'https://givta.ng/sponsored/fitwell-challenge',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)),
    maxParticipants: 100,
    prizeSplitRatios: { 1: 60, 2: 30, 3: 10 },
    sponsorName: 'FitWell Nigeria',
    sponsorLogoUrl: 'https://example.com/fitwell-logo.png',
    sponsorWebsite: 'https://fitwell.ng',
    sponsorDescription: 'Premium fitness equipment and supplements',
    totalTips: 0,
    totalAmount: 0,
    totalParticipants: 0,
    totalViews: 20,
    totalShares: 12,
    upvotes: 0,
    downvotes: 0,
    hashtags: ['fitness', 'sponsored', 'transformation'],
    isDeleted: false
  }
];

const sampleSponsor = {
  userId: 'demo-sponsor-user',
  brandName: 'FitWell Nigeria',
  contactEmail: 'partnerships@fitwell.ng',
  contactPhone: '+234123456789',
  website: 'https://fitwell.ng',
  logoUrl: 'https://example.com/fitwell-logo.png',
  brandColors: {
    primary: '#4B0082',
    secondary: '#32CD32'
  },
  totalFunding: 500000,
  totalChallenges: 5,
  activeChallenges: 2,
  isVerified: true,
  verificationStatus: 'verified',
  verificationDocuments: ['business-registration.pdf', 'tax-certificate.pdf'],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  isActive: true
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field =>
    !firebaseConfig[field] || firebaseConfig[field] === `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`
  );

  if (missingFields.length > 0) {
    console.error('❌ Firebase configuration is not properly set!');
    console.error('Missing or placeholder values for:', missingFields.join(', '));
    console.error('\nPlease set your Firebase environment variables:');
    console.error('  export EXPO_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"');
    console.error('  export EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"');
    console.error('  export EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"');
    console.error('  etc...');
    return false;
  }
  return true;
}

// Populate function
async function populateNewCollections() {
  console.log('🚀 Starting population of new challenge collections (v2)...\n');

  // Validate configuration first
  if (!validateFirebaseConfig()) {
    process.exit(1);
  }

  try {
    // Create sample sponsor first
    console.log('📝 Creating sample sponsor...');
    const sponsorRef = await addDoc(collection(db, COLLECTIONS.SPONSORS), {
      ...sampleSponsor,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✅ Created sponsor: ${sponsorRef.id} - ${sampleSponsor.brandName}`);

    // Create sample challenges
    console.log('\n🎯 Creating sample challenges...');
    for (let i = 0; i < sampleChallenges.length; i++) {
      const challenge = sampleChallenges[i];
      try {
        const challengeRef = await addDoc(collection(db, COLLECTIONS.CHALLENGES), {
          ...challenge,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        console.log(`✅ Created challenge: ${challengeRef.id} - ${challenge.title} (${challenge.type})`);
      } catch (error) {
        console.error(`❌ Failed to create challenge ${challenge.title}:`, error.message);
      }
    }

    // Create sample participants for the competition challenge
    console.log('\n👥 Creating sample participants for competition...');
    const competitionDocRef = await addDoc(collection(db, COLLECTIONS.CHALLENGE_PARTICIPANTS), {
      challengeId: 'placeholder-challenge-id', // This would be updated with real challenge ID
      userId: 'participant-user-1',
      username: 'DanceKing_NG',
      avatarUrl: 'https://example.com/avatar1.png',
      joinedAt: Timestamp.now(),
      entryFeePaid: 2500,
      totalTipsReceived: 0,
      totalTipsGiven: 0,
      tipCount: 0,
      currentRank: 1,
      isActive: true,
      isDisqualified: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✅ Created participant: ${competitionDocRef.id} - DanceKing_NG`);

    // Create sample tip
    console.log('\n💰 Creating sample tip...');
    const tipDocRef = await addDoc(collection(db, COLLECTIONS.CHALLENGE_TIPS), {
      challengeId: 'placeholder-challenge-id',
      participantId: 'placeholder-participant-id',
      tipperId: 'demo-tipper-1',
      amount: 1000,
      currency: 'NGN',
      fee: 50, // 5%
      netAmount: 950,
      message: 'You got this! 🔥',
      isAnonymous: false,
      paymentStatus: 'completed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✅ Created tip: ${tipDocRef.id} - ₦1,000 with message`);

    console.log('\n🎉 Successfully populated new challenge collections!');
    console.log('\n📊 Summary:');
    console.log(`   • 1 Sponsor profile`);
    console.log(`   • 3 Sample challenges (Personal, Competition, Sponsored)`);
    console.log(`   • 1 Sample participant`);
    console.log(`   • 1 Sample tip`);

    console.log('\n💡 Note: Challenge IDs need to be updated in participants/tips for proper relationships.');

  } catch (error) {
    console.error('❌ Error populating collections:', error);
    process.exit(1);
  }
}

// Clear old collections function
async function clearOldCollections() {
  console.log('🧹 Clearing old challenge collections (v1)...');
  // Note: This would require administrative access to delete entire collections
  console.log('⚠️  Manual deletion required via Firebase Console for:');
  console.log('   • challenges (old collection)');
  console.log('   • challengeTips (old collection)');
  console.log('   • challengeTypes (old collection)');
}

// Run the population
if (require.main === module) {
  populateNewCollections()
    .then(() => {
      console.log('\n✨ Population complete! Your new v2 collections are ready.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateNewCollections, clearOldCollections };
