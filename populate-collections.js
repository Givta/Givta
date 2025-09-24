const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  Timestamp
} = require('firebase/firestore');

// Firebase configuration (from givta/src/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDvssOJOXt7QbS77XUUxUhGjH-TmnKVjjg",
  authDomain: "givta-94cb8.firebaseapp.com",
  projectId: "givta-94cb8",
  storageBucket: "givta-94cb8.firebasestorage.app",
  messagingSenderId: "740641129167",
  appId: "1:740641129167:web:c789945191a72f0832edba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function populateCollections() {
  try {
    console.log('🚀 Starting real collections population...');

    // Test data for all collections
    const testData = {
      users: [
        {
          id: 'user_john_doe',
          email: 'john.doe@example.com',
          username: 'john_doe',
          phoneNumber: '2348012345678',
          photoURL: null,
          emailVerified: true,
          phoneVerified: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          referralCode: 'JOHN123',
          referredBy: null,
          userType: 'user',
          isVerified: true,
          kycStatus: 'verified',
          totalReferrals: 1,
          totalEarnings: 100,
          preferences: {
            notifications: true,
            language: 'en',
            currency: 'NGN',
            theme: 'light'
          }
        },
        {
          id: 'user_jane_smith',
          email: 'jane.smith@example.com',
          username: 'jane_smith',
          phoneNumber: '2348023456789',
          photoURL: null,
          emailVerified: true,
          phoneVerified: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          isActive: true,
          referralCode: 'JANE456',
          referredBy: 'user_john_doe',
          userType: 'user',
          isVerified: false,
          kycStatus: 'pending',
          totalReferrals: 0,
          totalEarnings: 100,
          preferences: {
            notifications: true,
            language: 'en',
            currency: 'NGN',
            theme: 'dark'
          }
        },
        {
          id: 'user_bob_wilson',
          email: 'bob.wilson@example.com',
          username: 'bob_wilson',
          phoneNumber: '2348034567890',
          photoURL: null,
          emailVerified: false,
          phoneVerified: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLoginAt: null,
          isActive: true,
          referralCode: 'BOB789',
          referredBy: null,
          userType: 'user',
          isVerified: false,
          kycStatus: 'not_submitted',
          totalReferrals: 0,
          totalEarnings: 0,
          preferences: {
            notifications: false,
            language: 'en',
            currency: 'NGN',
            theme: 'system'
          }
        }
      ],

      wallets: [
        {
          id: 'wallet_john',
          userId: 'user_john_doe',
          balance: 5000,
          currency: 'NGN',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isActive: true,
          totalDeposits: 6000,
          totalWithdrawals: 1000,
          totalTipsSent: 2000,
          totalTipsReceived: 3000,
          totalReferralEarnings: 100,
          lastTransactionAt: Timestamp.now()
        },
        {
          id: 'wallet_jane',
          userId: 'user_jane_smith',
          balance: 2500,
          currency: 'NGN',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isActive: true,
          totalDeposits: 3000,
          totalWithdrawals: 500,
          totalTipsSent: 1000,
          totalTipsReceived: 1500,
          totalReferralEarnings: 100,
          lastTransactionAt: Timestamp.now()
        },
        {
          id: 'wallet_bob',
          userId: 'user_bob_wilson',
          balance: 1000,
          currency: 'NGN',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isActive: true,
          totalDeposits: 1000,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          lastTransactionAt: Timestamp.now()
        }
      ],

      transactions: [
        {
          id: 'txn_deposit_1',
          userId: 'user_john_doe',
          type: 'deposit',
          amount: 5000,
          description: 'Wallet funding via Paystack',
          status: 'completed',
          reference: 'DEP_001',
          recipientId: null,
          senderId: null,
          paymentMethod: 'paystack',
          currency: 'NGN',
          fee: 0,
          netAmount: 5000,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          metadata: {
            paystackReference: 'ref_12345'
          }
        },
        {
          id: 'txn_tip_1',
          userId: 'user_john_doe',
          type: 'tip_sent',
          amount: 500,
          description: 'Tip sent to Jane Smith',
          status: 'completed',
          reference: 'TIP_001',
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 10,
          netAmount: 490,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          metadata: {
            tipDetails: {
              message: 'Great work!',
              isAnonymous: false
            },
            whatsappMessageId: 'msg_123'
          }
        },
        {
          id: 'txn_tip_received_1',
          userId: 'user_jane_smith',
          type: 'tip_received',
          amount: 490,
          description: 'Tip received from John Doe',
          status: 'completed',
          reference: 'TIP_001',
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 0,
          netAmount: 490,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          metadata: {
            tipDetails: {
              message: 'Great work!',
              isAnonymous: false
            }
          }
        }
      ],

      referrals: [
        {
          id: 'ref_john_jane',
          referrerId: 'user_john_doe',
          referredId: 'user_jane_smith',
          level: 1,
          bonus: 100,
          status: 'completed',
          referralCode: 'JOHN123',
          platform: 'mobile_app',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          metadata: {
            referrerName: 'John Doe',
            referredName: 'Jane Smith',
            bonusTransactionId: 'txn_bonus_1'
          }
        }
      ],

      tips: [
        {
          id: 'tip_john_jane',
          senderId: 'user_john_doe',
          recipientId: 'user_jane_smith',
          amount: 500,
          description: 'Great work on the project!',
          isAnonymous: false,
          status: 'completed',
          currency: 'NGN',
          fee: 10,
          netAmount: 490,
          platform: 'whatsapp',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          metadata: {
            senderName: 'John Doe',
            recipientName: 'Jane Smith',
            message: 'Great work!',
            whatsappMessageId: 'msg_123'
          }
        }
      ],

      notifications: [
        {
          id: 'notif_welcome_john',
          userId: 'user_john_doe',
          title: 'Welcome to Givta!',
          message: 'Your account has been successfully created. Start exploring our features!',
          type: 'system',
          priority: 'high',
          read: false,
          delivered: true,
          platform: 'all',
          data: {
            actionUrl: '/profile',
            deepLink: 'givta://profile'
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          readAt: null,
          deliveredAt: Timestamp.now(),
          expiresAt: null
        },
        {
          id: 'notif_tip_jane',
          userId: 'user_jane_smith',
          title: 'You received a tip!',
          message: 'John Doe sent you ₦490. Check your balance!',
          type: 'tip',
          priority: 'medium',
          read: false,
          delivered: true,
          platform: 'all',
          data: {
            transactionId: 'txn_tip_received_1',
            amount: 490,
            actionUrl: '/wallet'
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          readAt: null,
          deliveredAt: Timestamp.now(),
          expiresAt: null
        }
      ],

      kyc: [
        {
          id: 'kyc_john',
          userId: 'user_john_doe',
          status: 'verified',
          submittedAt: Timestamp.now(),
          verifiedAt: Timestamp.now(),
          verifiedBy: 'admin_system',
          rejectionReason: null,
          documents: {
            idCard: 'https://storage.googleapis.com/givta-kyc/id_john.jpg',
            passport: null,
            utilityBill: 'https://storage.googleapis.com/givta-kyc/utility_john.pdf'
          },
          personalInfo: {
            fullName: 'John Doe',
            dateOfBirth: '1990-01-01',
            address: '123 Main St, Lagos, Nigeria',
            nationality: 'Nigerian',
            idNumber: '12345678901',
            idType: 'national_id'
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          id: 'kyc_jane',
          userId: 'user_jane_smith',
          status: 'pending',
          submittedAt: Timestamp.now(),
          verifiedAt: null,
          verifiedBy: null,
          rejectionReason: null,
          documents: {
            idCard: 'https://storage.googleapis.com/givta-kyc/id_jane.jpg',
            passport: null,
            utilityBill: null
          },
          personalInfo: {
            fullName: 'Jane Smith',
            dateOfBirth: '1992-05-15',
            address: '456 Oak Ave, Abuja, Nigeria',
            nationality: 'Nigerian',
            idNumber: '98765432109',
            idType: 'drivers_license'
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ]
    };

    // Clear existing data first
    console.log('🧹 Clearing existing data...');
    const collections = Object.keys(testData);

    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Cleared ${collectionName} collection (${snapshot.size} documents)`);
      }
    }

    // Add test data
    console.log('📝 Populating collections...');

    for (const [collectionName, documents] of Object.entries(testData)) {
      console.log(`📝 Adding ${documents.length} documents to ${collectionName}...`);

      for (const document of documents) {
        const docRef = doc(collection(db, collectionName), document.id);
        await setDoc(docRef, document);
        console.log(`✅ Added ${document.id} to ${collectionName}`);
      }
    }

    console.log('🎉 All collections populated successfully!');
    console.log('\n📋 Test Accounts Ready:');
    console.log('1. John Doe - Username: john_doe, Phone: 2348012345678, Balance: ₦5,000');
    console.log('2. Jane Smith - Username: jane_smith, Phone: 2348023456789, Balance: ₦2,500');
    console.log('3. Bob Wilson - Username: bob_wilson, Phone: 2348034567890, Balance: ₦1,000');
    console.log('\n🔑 Referral Codes:');
    console.log('• JOHN123 (John Doe)');
    console.log('• JANE456 (Jane Smith)');
    console.log('• BOB789 (Bob Wilson)');
    console.log('\n📱 WhatsApp Testing:');
    console.log('Use phone number 2348012345678 for John Doe account');
    console.log('Commands: /profile, /editprofile, /tip, /balance, etc.');

  } catch (error) {
    console.error('❌ Error populating collections:', error);
  }
}

// Run the population script
populateCollections().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
