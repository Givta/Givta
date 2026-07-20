const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'Backend', 'firebase-service-account.json');

if (!require('fs').existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found!');
  console.log('Expected location:', serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: 'givta-94cb8'
});

const db = admin.firestore();

// Collection names - using same names as backend collections
const COLLECTIONS = {
  USERS: 'users',
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',
  REFERRALS: 'referrals',
  TIPS: 'tips',
  NOTIFICATIONS: 'notifications',
  KYC: 'kyc',
  EXTERNAL_TIPS: 'externalTips',
  TIP_LINKS: 'tipLinks',
  TWO_FACTOR_SETUP: 'twoFactorSetup',
  TWO_FACTOR_BACKUP_CODES: 'twoFactorBackupCodes',
  WEBHOOK_LOGS: 'webhookLogs',
  ACHIEVEMENTS: 'achievements',
  USER_STATS: 'userStats',
  RANKING_RULES: 'rankingRules',
};

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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          totalDeposits: 6000,
          totalWithdrawals: 1000,
          totalTipsSent: 2000,
          totalTipsReceived: 5000,
          totalReferralEarnings: 100,
          lastTransactionAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'wallet_jane',
          userId: 'user_jane_smith',
          balance: 2500,
          currency: 'NGN',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          totalDeposits: 5000,
          totalWithdrawals: 500,
          totalTipsSent: 1000,
          totalTipsReceived: 1500,
          totalReferralEarnings: 100,
          lastTransactionAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'wallet_bob',
          userId: 'user_bob_wilson',
          balance: 1000,
          currency: 'NGN',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          totalDeposits: 1000,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          lastTransactionAt: admin.firestore.FieldValue.serverTimestamp()
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
          deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
          deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        }
      ],

      kyc: [
        {
          id: 'kyc_john',
          userId: 'user_john_doe',
          status: 'verified',
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'kyc_jane',
          userId: 'user_jane_smith',
          status: 'pending',
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      externalTips: [
        {
          id: 'ext_tip_001',
          tipLinkId: 'tip_link_john_001',
          senderName: 'Anonymous Supporter',
          senderEmail: 'supporter@example.com',
          amount: 1000,
          message: 'Keep up the great content! Here\'s a tip to support your work.',
          currency: 'NGN',
          status: 'completed',
          paymentReference: 'EXT_TIP_001',
          platformFee: 20,
          recipientAmount: 980,
          paymentMethod: 'paystack',
          isAnonymous: true,
          senderIp: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      tipLinks: [
        {
          id: 'tip_link_john_001',
          userId: 'user_john_doe',
          title: 'Support My Content Creation',
          description: 'Help me create more amazing content! Every tip goes towards better equipment and tutorials.',
          customSlug: 'johncreates',
          theme: 'default',
          isActive: true,
          totalTips: 1500,
          totalTippers: 12,
          views: 245,
          settings: {
            allowAnonymous: true,
            showRecentTips: true,
            customMessage: 'Thank you for your support! 💝'
          },
          expiresAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'tip_link_jane_001',
          userId: 'user_jane_smith',
          title: 'Buy Me a Coffee ☕',
          description: 'If you enjoy my work, consider buying me a coffee to keep me energized!',
          customSlug: 'jane-coffee',
          theme: 'dark',
          isActive: true,
          totalTips: 750,
          totalTippers: 8,
          views: 156,
          settings: {
            allowAnonymous: false,
            showRecentTips: false,
            customMessage: 'Thanks for the coffee! ☕'
          },
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      twoFactorSetup: [
        {
          id: '2fa_john',
          userId: 'user_john_doe',
          isEnabled: true,
          method: 'sms',
          phoneNumber: '+2348012345678',
          backupEmail: 'john.doe.backup@example.com',
          secretKey: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'otpauth://totp/Givta:john.doe@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Givta',
          failedAttempts: 0,
          lastFailedAttempt: null,
          lockedUntil: null,
          setupCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      twoFactorBackupCodes: [
        {
          id: 'backup_john_001',
          userId: 'user_john_doe',
          code: 'ABC123DEF456',
          isUsed: false,
          usedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        },
        {
          id: 'backup_john_002',
          userId: 'user_john_doe',
          code: 'GHI789JKL012',
          isUsed: false,
          usedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        },
        {
          id: 'backup_john_003',
          userId: 'user_john_doe',
          code: 'MNO345PQR678',
          isUsed: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        }
      ],

      webhookLogs: [
        {
          id: 'webhook_paystack_001',
          provider: 'paystack',
          eventType: 'charge.success',
          payload: {
            event: 'charge.success',
            data: {
              id: 123456789,
              reference: 'ref_abcdef123456',
              amount: 500000,
              currency: 'NGN',
              status: 'success'
            }
          },
          status: 'processed',
          processingTime: 150,
          errorMessage: null,
          retryCount: 0,
          nextRetryAt: null,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'webhook_paystack_002',
          provider: 'paystack',
          eventType: 'transfer.success',
          payload: {
            event: 'transfer.success',
            data: {
              id: 987654321,
              reference: 'wdr_ghijkl789012',
              amount: 250000,
              currency: 'NGN',
              status: 'success'
            }
          },
          status: 'processed',
          processingTime: 200,
          errorMessage: null,
          retryCount: 0,
          nextRetryAt: null,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'webhook_paystack_003',
          provider: 'paystack',
          eventType: 'charge.failed',
          payload: {
            event: 'charge.failed',
            data: {
              id: 555666777,
              reference: 'ref_failed_attempt',
              amount: 100000,
              currency: 'NGN',
              status: 'failed',
              message: 'Insufficient funds'
            }
          },
          status: 'failed',
          processingTime: 0,
          errorMessage: 'Payment failed: Insufficient funds',
          retryCount: 3,
          nextRetryAt: admin.firestore.FieldValue.serverTimestamp(),
          processedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      challengeTypes: [
        {
          id: 'celebration_birthday',
          name: 'Birthday Celebration',
          category: 'celebration',
          description: 'Celebrate special occasions with collective tipping',
          entryFee: 0,
          duration: 7 * 24 * 60 * 60 * 1000,
          template: {
            title: "Happy Birthday! 🎂",
            subtitle: "Join the celebration!",
            description: "Let's make this birthday unforgettable with collective generosity!",
            socialMessage: "Join me in celebrating 🎂! Tip to contribute to the celebration!"
          },
          celebrationDefaults: {
            goalAmount: 5000,
            rewardPercentage: 3
          }
        },
        {
          id: 'competition_fitness',
          name: 'Fitness Challenge',
          category: 'competition',
          description: 'Compete in fitness challenges and win prizes',
          entryFee: 500,
          duration: 30 * 24 * 60 * 60 * 1000,
          template: {
            title: "Fitness Showdown 🏃‍♂️",
            subtitle: "₦XX,XXX Prize Pool!",
            description: "Step up your fitness game and compete for amazing prizes!",
            socialMessage: "I'm challenging myself to 30 days of fitness! Tip to join and compete! 💪"
          },
          competitionDefaults: {
            maxParticipants: 50,
            prizeSplitRatios: {1: 50, 2: 25, 3: 15, 4: 6, 5: 4},
            allowLateJoin: true
          }
        },
        {
          id: 'sponsored_content',
          name: 'Content Creator Challenge',
          category: 'sponsored',
          description: 'Sponsored challenges for content creators',
          entryFee: 200,
          duration: 14 * 24 * 60 * 60 * 1000,
          template: {
            title: "Content Creation Challenge 📹",
            subtitle: "Create Amazing Content!",
            description: "Show your creativity and win sponsor prizes!",
            socialMessage: "Sponsoring amazing content! Tip to join the challenge! 🎥"
          },
          sponsorDefaults: {
            sponsorName: "TechCorp Nigeria",
            additionalPrizeValue: 10000
          }
        }
      ],

        {
          id: 'challenge_birthday_john',
          userId: 'user_john_doe',
          typeId: 'celebration_birthday',
          title: 'John\'s 30th Birthday Bash 🎂',
          description: 'Help me celebrate turning 30! Every tip goes towards making this the best birthday ever!',
          category: 'celebration',
          entryFee: 0,
          currency: 'NGN',
          status: 'active',
          isPublic: true,
          shareableUrl: 'givta.app/challenge/john-birthday',
          customSlug: 'john-30th-birthday',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          social: {
            customMessage: '🎂 Let\'s make John\'s 30th birthday unforgettable!',
            hashtags: ['birthday', 'celebration', 'givta'],
            mediaUrls: ['https://example.com/birthday-banner.jpg']
          },
          venue: {
            type: 'online',
            link: 'https://zoom.us/john-birthday-party',
            details: 'Virtual celebration on Zoom'
          },
          analytics: {
            totalTips: 12,
            totalAmount: 3500,
            uniqueTippers: 10,
            shares: 5,
            views: 45
          },
          celebrationSettings: {
            goalAmount: 5000,
            currentAmount: 3500,
            rewardPercentage: 3,
            claimed: false,
            claimedAt: null
          },
          finance: {
            entryFeesCollected: 0,
            platformFee: 105,
            totalPrizePool: 0,
            sponsorContribution: 0
          }
        },
        {
          id: 'challenge_fitness_jane',
          userId: 'user_jane_smith',
          typeId: 'competition_fitness',
          title: '30-Day Fitness Transformation 💪',
          description: '30-day fitness challenge! Log your workouts, share progress, and compete for prizes!',
          category: 'competition',
          entryFee: 500,
          currency: 'NGN',
          status: 'running',
          isPublic: true,
          shareableUrl: 'givta.app/challenge/jane-fitness',
          customSlug: 'jane-fitness-2025',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          social: {
            customMessage: 'Are you ready to transform? Join my 30-day fitness challenge! 💪',
            hashtags: ['fitness', 'challenge', 'transformation'],
            mediaUrls: ['https://example.com/fitness-start.jpg']
          },
          venue: {
            type: 'social_media',
            details: 'Follow progress on Instagram and TikTok'
          },
          analytics: {
            totalTips: 8,
            totalAmount: 2500,
            uniqueTippers: 6,
            shares: 12,
            views: 78
          },
          competitionSettings: {
            maxParticipants: 50,
            participants: [
              {
                userId: 'user_jane_smith',
                name: 'Jane Smith',
                totalTips: 500,
                joinedAt: admin.firestore.Timestamp.now(),
                rank: 1
              },
              {
                userId: 'user_john_doe',
                name: 'John Doe',
                totalTips: 800,
                joinedAt: admin.firestore.Timestamp.now(),
                rank: 2
              },
              {
                userId: 'user_bob_wilson',
                name: 'Bob Wilson',
                totalTips: 300,
                joinedAt: admin.firestore.Timestamp.now(),
                rank: 3
              }
            ],
            prizeSplitRatios: {1: 50, 2: 25, 3: 15, 4: 6, 5: 4}
          },
          finance: {
            entryFeesCollected: 2500,
            platformFee: 75,
            totalPrizePool: 2425,
            sponsorContribution: 0
          }
        },
        {
          id: 'challenge_sponsored_bob',
          userId: 'user_bob_wilson',
          typeId: 'sponsored_content',
          title: 'Tech Content Creator Challenge 🚀',
          description: 'Create amazing tech content and win prizes sponsored by TechCorp Nigeria!',
          category: 'sponsored',
          entryFee: 200,
          currency: 'NGN',
          status: 'completed',
          isPublic: true,
          shareableUrl: 'givta.app/challenge/tech-content',
          customSlug: 'tech-content-challenge',
          startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          social: {
            customMessage: 'Sponsored by TechCorp! Create tech content and win amazing prizes! 🚀',
            hashtags: ['tech', 'content', 'creator', 'sponsored']
          },
          analytics: {
            totalTips: 15,
            totalAmount: 2000,
            uniqueTippers: 12,
            shares: 8,
            views: 156
          },
          sponsorInfo: {
            sponsorName: 'TechCorp Nigeria',
            sponsorLogo: 'https://example.com/techcorp-logo.png',
            additionalPrizeDescription: '1-year TechCorp Premium Subscription',
            additionalPrizeValue: 10000
          },
          winners: [
            {
              userId: 'user_bob_wilson',
              name: 'Bob Wilson',
              prizeAmount: 6000,
              rank: 1,
              selectedAt: admin.firestore.Timestamp.now()
            },
            {
              userId: 'user_john_doe',
              name: 'John Doe',
              prizeAmount: 5000,
              rank: 2,
              selectedAt: admin.firestore.Timestamp.now()
            }
          ],
          finance: {
            entryFeesCollected: 400,
            platformFee: 60,
            totalPrizePool: 16000,
            sponsorContribution: 10000,
            distributedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        }
      ],

      challengeTips: [
        {
          id: 'challenge_tip_john_birthday_1',
          challengeId: 'challenge_birthday_john',
          tipperId: 'user_jane_smith',
          tipperName: 'Jane Smith',
          amount: 500,
          currency: 'NGN',
          message: 'Happy Birthday John! Hope you have an amazing day! 🎂',
          isAnonymous: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'challenge_tip_john_birthday_2',
          challengeId: 'challenge_birthday_john',
          tipperId: 'anonymous_user_123',
          tipperName: 'Anonymous Supporter',
          amount: 1000,
          currency: 'NGN',
          message: 'Wishing you success in your new year! 🎉',
          isAnonymous: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'challenge_tip_jane_fitness_1',
          challengeId: 'challenge_fitness_jane',
          tipperId: 'user_john_doe',
          tipperName: 'John Doe',
          amount: 500,
          currency: 'NGN',
          message: 'Great progress! Keep it up! 💪',
          isAnonymous: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'challenge_tip_bob_sponsored_1',
          challengeId: 'challenge_sponsored_bob',
          tipperId: 'user_john_doe',
          tipperName: 'John Doe',
          amount: 800,
          currency: 'NGN',
          message: 'Amazing tech content! Love your tutorials! 🚀',
          isAnonymous: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      userGamification: [
        {
          id: 'user_john_doe',
          userId: 'user_john_doe',
          level: 5,
          xp: 1650,
          totalXp: 1650,
          xpToNextLevel: 350,
          currentStreak: 3,
          longestStreak: 7,
          lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
          achievements: [
            {
              id: 'first_challenge',
              name: 'First Steps',
              description: 'Join your first challenge',
              type: 'participation',
              rarity: 'common',
              icon: '🎯',
              requirements: { minValue: 1 },
              rewards: { xp: 50, title: 'Challenger' },
              unlockedAt: admin.firestore.Timestamp.now()
            },
            {
              id: 'challenge_enthusiast',
              name: 'Challenge Enthusiast',
              description: 'Join 10 different challenges',
              type: 'participation',
              rarity: 'common',
              icon: '🔥',
              requirements: { minValue: 10 },
              rewards: { xp: 200 },
              unlockedAt: admin.firestore.Timestamp.now()
            },
            {
              id: 'first_win',
              name: 'Triumphant Debut',
              description: 'Win your first challenge',
              type: 'winning',
              rarity: 'rare',
              icon: '👑',
              requirements: { minValue: 1 },
              rewards: { xp: 300, title: 'Winner' },
              unlockedAt: admin.firestore.Timestamp.now()
            },
            {
              id: 'generous_soul',
              name: 'Generous Soul',
              description: 'Give tips totaling ₦10,000',
              type: 'generosity',
              rarity: 'rare',
              icon: '💝',
              requirements: { minValue: 10000 },
              rewards: { xp: 600, title: 'Philanthropist' },
              unlockedAt: admin.firestore.Timestamp.now()
            }
          ],
          unlockedTitles: ['Challenger', 'Winner', 'Philanthropist'],
          specialEffects: [],
          totalChallenges: 12,
          totalWins: 3,
          totalTipsGiven: 2000,
          totalTipsReceived: 1500,
          totalPrizeMoney: 2500,
          friendsInvited: 2,
          challengesShared: 5,
          viralShares: 0,
          eliteStatus: 'silver',
          reputationScore: 450,
          title: 'Philanthropist',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'user_jane_smith',
          userId: 'user_jane_smith',
          level: 3,
          xp: 750,
          totalXp: 750,
          xpToNextLevel: 250,
          currentStreak: 1,
          longestStreak: 4,
          lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
          achievements: [
            {
              id: 'first_challenge',
              name: 'First Steps',
              description: 'Join your first challenge',
              type: 'participation',
              rarity: 'common',
              icon: '🎯',
              requirements: { minValue: 1 },
              rewards: { xp: 50, title: 'Challenger' },
              unlockedAt: admin.firestore.Timestamp.now()
            },
            {
              id: 'first_win',
              name: 'Triumphant Debut',
              description: 'Win your first challenge',
              type: 'winning',
              rarity: 'rare',
              icon: '👑',
              requirements: { minValue: 1 },
              rewards: { xp: 300, title: 'Winner' },
              unlockedAt: admin.firestore.Timestamp.now()
            }
          ],
          unlockedTitles: ['Challenger', 'Winner'],
          specialEffects: [],
          totalChallenges: 6,
          totalWins: 2,
          totalTipsGiven: 500,
          totalTipsReceived: 1000,
          totalPrizeMoney: 1200,
          friendsInvited: 0,
          challengesShared: 2,
          viralShares: 0,
          eliteStatus: 'bronze',
          reputationScore: 250,
          title: 'Winner',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'user_bob_wilson',
          userId: 'user_bob_wilson',
          level: 1,
          xp: 100,
          totalXp: 100,
          xpToNextLevel: 100,
          currentStreak: 0,
          longestStreak: 1,
          lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
          achievements: [
            {
              id: 'first_challenge',
              name: 'First Steps',
              description: 'Join your first challenge',
              type: 'participation',
              rarity: 'common',
              icon: '🎯',
              requirements: { minValue: 1 },
              rewards: { xp: 50, title: 'Challenger' },
              unlockedAt: admin.firestore.Timestamp.now()
            }
          ],
          unlockedTitles: ['Challenger'],
          specialEffects: [],
          totalChallenges: 1,
          totalWins: 0,
          totalTipsGiven: 0,
          totalTipsReceived: 0,
          totalPrizeMoney: 0,
          friendsInvited: 0,
          challengesShared: 0,
          viralShares: 0,
          eliteStatus: 'none',
          reputationScore: 50,
          title: 'Challenger',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      // Weekly Ranking System Collections
      achievements: [
        {
          userId: 'sample-user-1',
          type: 'streak',
          title: 'Week Warrior',
          description: 'Tipped for 7 consecutive days',
          icon: '🔥',
          progress: 7,
          target: 7,
          metadata: { previousStreak: 6 },
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        },
        {
          userId: 'user_john_doe',
          type: 'milestone',
          title: 'Tip Master',
          description: 'Sent tips totaling ₦50,000',
          icon: '👑',
          progress: 50000,
          target: 50000,
          metadata: {},
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        },
        {
          userId: 'user_jane_smith',
          type: 'rank_achievement',
          title: 'Weekly Champion',
          description: 'Achieved 1st place weekly!',
          icon: '🏆',
          progress: 1,
          target: 1,
          metadata: { rankAchieved: 1 },
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        }
      ],

      userStats: [
        {
          userId: 'user_john_doe',
          weeklyStats: {
            currentTipperRank: 1,
            currentTippedRank: 3,
            bestTipperRank: 1,
            bestTippedRank: 2,
            bonusesThisWeek: 500,
            tipsGivenThisWeek: 25,
            tipsReceivedThisWeek: 15,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          },
          streaks: {
            currentTipStreak: 7,
            longestTipStreak: 14,
            lastTipDate: admin.firestore.FieldValue.serverTimestamp()
          },
          achievements: {
            totalEarned: 5,
            recentAchievements: ['Tip Master', 'Week Warrior']
          }
        },
        {
          userId: 'user_jane_smith',
          weeklyStats: {
            currentTipperRank: 3,
            currentTippedRank: 1,
            bestTipperRank: 1,
            bestTippedRank: 1,
            bonusesThisWeek: 300,
            tipsGivenThisWeek: 12,
            tipsReceivedThisWeek: 20,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          },
          streaks: {
            currentTipStreak: 4,
            longestTipStreak: 7,
            lastTipDate: admin.firestore.FieldValue.serverTimestamp()
          },
          achievements: {
            totalEarned: 3,
            recentAchievements: ['Weekly Champion', 'Podium King']
          }
        }
      ],

      rankingRules: [
        {
          id: 'ranking_rules_001',
          weekStartDay: 1, // Monday
          bonusStructure: {
            rank1: 5, // 5% bonus for 1st place
            rank2: 3, // 3% bonus for 2nd place
            rank3: 1  // 1% bonus for 3rd place
          },
          penalties: {
            inactivateAfterDays: 30,
            minimumTipsForRanking: 5
          },
          achievements: {
            streakDefinitions: [
              { days: 7, title: 'Week Warrior', description: 'Tipped for 7 consecutive days' },
              { days: 14, title: 'Fortnite Fighter', description: 'Tipped for 14 consecutive days' },
              { days: 30, title: 'Elite Contributor', description: 'Tipped for 30 consecutive days' }
            ],
            rankDefinitions: [
              { rank: 10, title: 'Top 10 Champion', description: 'Reached top 10 weekly rankings' },
              { rank: 3, title: 'Podium King', description: 'Reached top 3 weekly rankings' },
              { rank: 1, title: 'Weekly Champion', description: 'Achieved 1st place weekly!' }
            ]
          },
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'admin',
          isActive: true
        }
      ],

      // Additional weekly transactions for ranking calculations
      weeklyRankingTransactions: [
        {
          id: 'weekly_txn_john_1',
          userId: 'user_john_doe',
          type: 'tip_sent',
          amount: 2000,
          netAmount: 1900,
          description: 'Weekly ranking tip',
          status: 'completed',
          currency: 'NGN',
          fee: 100,
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'weekly_txn_john_2',
          userId: 'user_john_doe',
          type: 'tip_sent',
          amount: 1500,
          netAmount: 1425,
          description: 'Weekly ranking tip',
          status: 'completed',
          currency: 'NGN',
          fee: 75,
          recipientId: 'user_bob_wilson',
          senderId: 'user_john_doe',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'weekly_txn_jane_1',
          userId: 'user_jane_smith',
          type: 'tip_received',
          amount: 2500,
          netAmount: 2500,
          description: 'Weekly ranking received',
          status: 'completed',
          currency: 'NGN',
          fee: 0,
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

      // Sponsored Challenges Test Data
      sponsoredChallenges: [
        {
          id: 'sponsored_featured',
          title: 'Tech Gadget Launch Challenge',
          description: 'Join TechCorp\'s exciting new product launch! Showcase your tech skills and creative content creation abilities to win amazing prizes worth ₦500,000. Create engaging video content that demos TechCorp\'s latest products and share your unique perspective on the future of technology.',
          sponsorInfo: {
            sponsorName: 'TechCorp Nigeria',
            sponsorLogo: 'https://via.placeholder.com/100',
            sponsorWebsite: 'https://techcorp.ng',
            sponsorType: 'brand',
            contactEmail: 'sponsorship@techcorp.ng',
            contactPhone: '+2348012345678'
          },
          prizePool: {
            totalAmount: 500000,
            sponsorContribution: 500000,
            givtaEntryFee: 100,
            platformFee: 25000,
            actualPool: 475000,
            distributionRule: 'top3_60_30_10',
            entryFeePercentage: 5
          },
          prizeDistribution: {
            first: 285000,
            second: 142500,
            third: 47500,
          },
          rules: {
            eligibility: [
              'Must be 18 years or older',
              'Must be a citizen or resident of Nigeria',
              'Must have an active Givta account',
              'No previous criminal convictions related to fraud or content manipulation',
            ],
            requirements: [
              'Create an original video of 1-3 minutes showcasing TechCorp products',
              'Use #TechCorpNG #GivtaChallenges challenge hashtag',
              'Follow TechCorp Nigeria on all social platforms',
              'Tag at least 3 friends in your entry',
              'Submit entry before challenge deadline',
            ],
            prohibitedActions: [
              'Using copyrighted material without permission',
              'Manipulating views, likes, or engagement artificially',
              'Creating misleading or false product claims',
              'Harassing or bullying other participants',
            ],
            judgingCriteria: [
              'Creativity and originality (40%)',
              'Technical quality and production (30%)',
              'Brand engagement and alignment (20%)',
              'Social impact potential (10%)',
            ],
          },
          tasks: [
            'Research TechCorp products and features',
            'Plan and script your video concept',
            'Record high-quality video content',
            'Edit video with professional standards',
            'Add appropriate music and effects',
            'Include challenge hashtag and sponsorship disclosure',
            'Upload to social media platforms',
            'Submit entry to Givta platform',
          ],
          analytics: {
            participantsCount: 127,
            impressions: 15400,
            engagement: 2890,
            shares: 45,
            views: 8900
          },
          timeline: {
            registrationStart: admin.firestore.FieldValue.serverTimestamp(),
            registrationEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            challengeStart: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
            challengeEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)),
            winnerAnnouncement: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)),
          },
          status: 'active',
          exposureFeatures: {
            showLogoInBanner: true,
            showLogoInApp: true,
            whatsAppBlast: true,
            inAppBanner: true,
          },
          category: 'tech',
          tags: ['content-creation', 'tech-gadgets', 'video-production'],
          social: {
            hashtag: '#TechCorpNGChallenge',
            shareableLink: 'givta.app/challenge/techcorp-launch',
            customMessage: '🏆 Join TechCorp\'s Launch Challenge! Sponsored by TechCorp Nigeria! 🚀'
          },
          creator: {
            userId: 'user_john_doe',
            name: 'John Doe',
            email: 'john.doe@example.com'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isApproved: true,
          approvalDate: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: 'admin_system'
        },
        {
          id: 'sponsored_influencer',
          title: 'Gamer\'s Paradise Tournament',
          description: 'Jamisi Gaming invites you to join our ultimate gaming challenge! Compete with fellow gamers and win exclusive prizes.',
          sponsorInfo: {
            sponsorName: 'Jamisi Gaming',
            sponsorLogo: 'https://via.placeholder.com/100',
            sponsorWebsite: 'https://jamisi.ng',
            sponsorType: 'influencer',
            contactEmail: 'partnerships@jamisi.ng',
            contactPhone: '+2348023456789'
          },
          prizePool: {
            totalAmount: 250000,
            sponsorContribution: 250000,
            givtaEntryFee: 100,
            platformFee: 12500,
            actualPool: 237500,
            distributionRule: 'top3_60_30_10',
            entryFeePercentage: 5
          },
          prizeDistribution: {
            first: 142500,
            second: 71250,
            third: 23750,
          },
          rules: {
            eligibility: [
              'Must be 16 years or older',
              'Active gaming enthusiast',
              'Must have social media presence',
              'Must be able to stream gameplay'
            ],
            requirements: [
              'Create gaming content featuring sponsor products',
              'Use #JamisiGaming #GivtaGaming challenge hashtag',
              'Follow Jamisi Gaming on all platforms',
              'Include in-game footage and streaming highlights',
              'Participate in live tournament events'
            ],
            prohibitedActions: [
              'Cheating or unfair play',
              'Hate speech or toxicity',
              'Copyright infringement',
              'Participating in multiple accounts'
            ],
            judgingCriteria: [
              'Gaming skill and performance (50%)',
              'Content quality and entertainment (30%)',
              'Community engagement (20%)'
            ],
          },
          tasks: [
            'Practice and master sponsor games',
            'Record high-quality gameplay footage',
            'Create engaging video content',
            'Add commentaries and highlights',
            'Stream live gaming sessions',
            'Interact with sponsor communities',
            'Publish content on social media',
            'Submit tournament participation'
          ],
          analytics: {
            participantsCount: 89,
            impressions: 9800,
            engagement: 1640,
            shares: 32,
            views: 7200
          },
          timeline: {
            registrationStart: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
            registrationEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
            challengeStart: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            challengeEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
            winnerAnnouncement: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)),
          },
          status: 'upcoming',
          exposureFeatures: {
            showLogoInBanner: true,
            showLogoInApp: false,
            whatsAppBlast: true,
            inAppBanner: true,
          },
          category: 'gaming',
          tags: ['gaming', 'e-sports', 'tournament', 'streaming'],
          social: {
            hashtag: '#JamisiGamingChallenge',
            shareableLink: 'givta.app/challenge/jamisi-tournament',
            customMessage: '🎮 Join Jamisi Gaming\'s Paradise Tournament! Free to enter, huge prizes! 🏆'
          },
          creator: {
            userId: 'user_bob_wilson',
            name: 'Bob Wilson',
            email: 'bob.wilson@example.com'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isApproved: true,
          approvalDate: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: 'admin_system'
        },
        {
          id: 'sponsored_business',
          title: 'Creative Content Challenge',
          description: 'Spark Media wants to see your creativity! Create amazing content and win our sponsored prize pool.',
          sponsorInfo: {
            sponsorName: 'Spark Media',
            sponsorLogo: 'https://via.placeholder.com/100',
            sponsorWebsite: 'https://sparkmedia.ng',
            sponsorType: 'business',
            contactEmail: 'creativity@sparkmedia.ng',
            contactPhone: '+2348034567890'
          },
          prizePool: {
            totalAmount: 150000,
            sponsorContribution: 150000,
            givtaEntryFee: 100,
            platformFee: 7500,
            actualPool: 142500,
            distributionRule: 'top3_60_30_10',
            entryFeePercentage: 5
          },
          prizeDistribution: {
            first: 85500,
            second: 42750,
            third: 14250,
          },
          rules: {
            eligibility: [
              'Creative content creator',
              'Must follow content creation best practices',
              'Age 18+',
              'Valid social media presence'
            ],
            requirements: [
              'Create original creative content',
              'Use #SparkMediaChallenge #GivtaCreative hashtag',
              'Follow Spark Media on all platforms',
              'Include brand-aligned creative elements',
              'Demonstrate unique creativity'
            ],
            prohibitedActions: [
              'Plagiarism of any kind',
              'AI-generated content without disclosure',
              'Offensive or inappropriate content',
              'Violation of platform guidelines'
            ],
            judgingCriteria: [
              'Creativity and originality (50%)',
              'Technical execution (25%)',
              'Content quality and polish (25%)'
            ],
          },
          tasks: [
            'Brainstorm creative concepts',
            'Develop unique content ideas',
            'Create high-quality visual content',
            'Edit and refine final piece',
            'Add proper branding elements',
            'Share on social media platforms',
            'Collect community feedback',
            'Submit final entry to Givta'
          ],
          analytics: {
            participantsCount: 42,
            impressions: 3200,
            engagement: 780,
            shares: 18,
            views: 5400
          },
          timeline: {
            registrationStart: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
            registrationEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
            challengeStart: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
            challengeEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
            winnerAnnouncement: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)),
          },
          status: 'active',
          exposureFeatures: {
            showLogoInBanner: true,
            showLogoInApp: true,
            whatsAppBlast: false,
            inAppBanner: true,
          },
          category: 'creative',
          tags: ['design', 'marketing', 'social-media', 'content-creation'],
          social: {
            hashtag: '#SparkMediaChallenge',
            shareableLink: 'givta.app/challenge/spark-creative',
            customMessage: '✨ Unleash your creativity! Join Spark Media\'s Creative Challenge! 🎨'
          },
          creator: {
            userId: 'user_jane_smith',
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isApproved: true,
          approvalDate: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: 'admin_system'
        }
      ],

      // Tipping Goals Collections
        {
          id: 'goal_john_fitness',
          creatorId: 'user_john_doe',
          goalAmount: 50000,
          currentAmount: 38750,
          title: '12-Week Fitness Transformation',
          description: 'Transform my body and build strength through consistent gym workouts and healthy living',
          emoji: '💪',
          isActive: true,
          isCompleted: false,
          goalType: 'ongoing',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 84 * 24 * 60 * 60 * 1000)), // 84 days
          progressPercentage: 77.5,
          stats: {
            totalSupporters: 12,
            totalTips: 45,
            daysActive: 42,
            averageDailyTips: 1071,
            largestTip: 5000
          },
          settings: {
            showProgress: true,
            showContributors: true,
            allowAnonymousTips: true,
            notifyOnCompletion: true
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'goal_jane_education',
          creatorId: 'user_jane_smith',
          goalAmount: 75000,
          currentAmount: 27500,
          title: 'Master\'s Degree Goal 🧠',
          description: 'Fund my master\'s degree in Computer Science to advance my career in tech',
          emoji: '🎓',
          isActive: true,
          isCompleted: false,
          goalType: 'ongoing',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)),
          progressPercentage: 36.7,
          stats: {
            totalSupporters: 18,
            totalTips: 85,
            daysActive: 35,
            averageDailyTips: 786,
            largestTip: 10000
          },
          settings: {
            showProgress: true,
            showContributors: true,
            allowAnonymousTips: true,
            notifyOnCompletion: true
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'goal_bob_startup',
          creatorId: 'user_bob_wilson',
          goalAmount: 100000,
          currentAmount: 42000,
          title: 'Tech Startup Launch 🚀',
          description: 'Build my first SaaS application and launch my tech company',
          emoji: '🚀',
          isActive: true,
          isCompleted: false,
          goalType: 'ongoing',
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
          progressPercentage: 42,
          stats: {
            totalSupporters: 27,
            totalTips: 112,
            daysActive: 56,
            averageDailyTips: 750,
            largestTip: 8000
          },
          settings: {
            showProgress: true,
            showContributors: true,
            allowAnonymousTips: true,
            notifyOnCompletion: true
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'goal_john_completed',
          creatorId: 'user_john_doe',
          goalAmount: 150000,
          currentAmount: 150000,
          title: 'Buy New Camera Equipment 📸',
          description: 'Upgrade my content creation gear to produce higher quality videos',
          emoji: '📸',
          isActive: false,
          isCompleted: true,
          goalType: 'ongoing',
          startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
          endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
          completedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
          progressPercentage: 100,
          stats: {
            totalSupporters: 34,
            totalTips: 156,
            daysActive: 90,
            averageDailyTips: 1667,
            largestTip: 25000
          },
          settings: {
            showProgress: true,
            showContributors: true,
            allowAnonymousTips: true,
            notifyOnCompletion: true
          },
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ],

        {
          id: 'contrib_john_fitness_1',
          goalId: 'goal_john_fitness',
          contributorId: 'user_jane_smith',
          contributorName: 'Jane Smith',
          amount: 5000,
          currency: 'NGN',
          message: 'Go John! You\'ve got this! 💪',
          isAnonymous: false,
          isRecurring: false,
          type: 'single',
          status: 'completed',
          paymentReference: 'TIP_GOAL_001',
          platform: 'mobile_app',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            contributingToGoals: true,
            goalTitle: '12-Week Fitness Transformation'
          }
        },
        {
          id: 'contrib_john_fitness_2',
          goalId: 'goal_john_fitness',
          contributorId: 'user_bob_wilson',
          contributorName: 'Bob Wilson',
          amount: 2500,
          currency: 'NGN',
          message: 'Supporting your fitness journey! 🔥',
          isAnonymous: false,
          isRecurring: true,
          recurringInterval: 'monthly',
          type: 'recurring',
          status: 'completed',
          paymentReference: 'TIP_GOAL_002',
          platform: 'whatsapp',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          nextPaymentDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          metadata: {
            contributingToGoals: true,
            goalTitle: '12-Week Fitness Transformation'
          }
        },
        {
          id: 'contrib_jane_education_1',
          goalId: 'goal_jane_education',
          contributorId: 'user_john_doe',
          contributorName: 'John Doe',
          amount: 10000,
          currency: 'NGN',
          message: 'Education is the best investment! Good luck! 🎓',
          isAnonymous: false,
          isRecurring: false,
          type: 'single',
          status: 'completed',
          paymentReference: 'TIP_GOAL_003',
          platform: 'web_app',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            contributingToGoals: true,
            goalTitle: 'Master\'s Degree Goal 🧠'
          }
        },
        {
          id: 'contrib_bob_startup_1',
          goalId: 'goal_bob_startup',
          contributorId: 'anonymous_contributor_123',
          contributorName: 'Anonymous Supporter',
          amount: 8000,
          currency: 'NGN',
          message: null,
          isAnonymous: true,
          isRecurring: false,
          type: 'single',
          status: 'completed',
          paymentReference: 'TIP_GOAL_004',
          platform: 'public_link',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            contributingToGoals: true,
            goalTitle: 'Tech Startup Launch 🚀'
          }
        },
        {
          id: 'contrib_john_camera_1',
          goalId: 'goal_john_completed',
          contributorId: 'user_jane_smith',
          contributorName: 'Jane Smith',
          amount: 25000,
          currency: 'NGN',
          message: 'These videos are worth it! Keep creating amazing content! 📹',
          isAnonymous: false,
          isRecurring: false,
          type: 'single',
          status: 'completed',
          paymentReference: 'TIP_GOAL_005',
          platform: 'mobile_app',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            contributingToGoals: true,
            goalTitle: 'Buy New Camera Equipment 📸'
          }
        }
      ],

      goalUpdates: [
        {
          id: 'update_john_fitness_1',
          goalId: 'goal_john_fitness',
          postedById: 'user_john_doe',
          userId: 'user_john_doe', // Keep for backwards compatibility
          title: 'Week 8 Progress Update!',
          message: 'Lost 12kg so far! Consistent gym sessions 5x week. Nutrition on point! 💪',
          type: 'progress_update',
          progressPercentage: 75,
          images: ['https://example.com/john-progress-week8.jpg'],
          likes: 12,
          comments: [
            {
              userId: 'user_jane_smith',
              userName: 'Jane Smith',
              message: 'Amazing progress! Keep crushing it!',
              timestamp: admin.firestore.Timestamp.now()
            }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          analytics: {
            views: 89,
            engagement: 45
          }
        },
        {
          id: 'update_jane_education_1',
          goalId: 'goal_jane_education',
          postedById: 'user_jane_smith',
          userId: 'user_jane_smith', // Keep for backwards compatibility
          title: 'Admitted to University of Lagos!',
          message: 'Got admitted to UNILAG Tech Masters program! Thank you all for your support 💙',
          type: 'milestone_achievement',
          progressPercentage: 25,
          images: ['https://example.com/admission-letter.jpg'],
          likes: 28,
          comments: [
            {
              userId: 'user_john_doe',
              userName: 'John Doe',
              message: 'CONGRATS! That\'s amazing! 🎓',
              timestamp: admin.firestore.Timestamp.now()
            }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          analytics: {
            views: 156,
            engagement: 89
          }
        },
        {
          id: 'update_bob_startup_1',
          goalId: 'goal_bob_startup',
          postedById: 'user_bob_wilson',
          userId: 'user_bob_wilson', // Keep for backwards compatibility
          title: 'MVP Prototype Complete!',
          message: 'First working version of the app is ready! Testing phase begins next week 🚀',
          type: 'milestone_achievement',
          progressPercentage: 40,
          images: ['https://example.com/bob-mvp-screen.jpg', 'https://example.com/app-interface.jpg'],
          likes: 34,
          comments: [
            {
              userId: 'user_john_doe',
              userName: 'John Doe',
              message: 'This looks incredible! Congrats on the MVP! 🔥',
              timestamp: admin.firestore.Timestamp.now()
            }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          analytics: {
            views: 201,
            engagement: 126
          }
        },
        {
          id: 'update_john_completed_1',
          goalId: 'goal_john_completed',
          postedById: 'user_john_doe',
          userId: 'user_john_doe', // Keep for backwards compatibility
          title: 'GOAL COMPLETE! 🎉',
          message: 'Reached 150k target! New camera gear is on the way. Thank you all for believing in me! 🎬',
          type: 'goal_completion',
          progressPercentage: 100,
          images: ['https://example.com/new-camera-unboxed.jpg'],
          likes: 67,
          comments: [
            {
              userId: 'user_jane_smith',
              userName: 'Jane Smith',
              message: 'CONGRATS! Can\'t wait to see the new content! 📸',
              timestamp: admin.firestore.Timestamp.now()
            },
            {
              userId: 'user_bob_wilson',
              userName: 'Bob Wilson',
              message: 'Well deserved! Keep creating amazing stuff! 🚀',
              timestamp: admin.firestore.Timestamp.now()
            }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          analytics: {
            views: 345,
            engagement: 203
          }
        }
      ],

      // Admin Dashboard Collections
      systemSettings: [
        {
          id: 'system_settings',
          platform: {
            name: 'Givta',
            version: '1.0.0',
            maintenanceMode: false,
            maxTipAmount: 50000,
            minTipAmount: 10,
            maxChallengeReward: 1000000,
            sponsoredChallengeFee: 25000,
          },
          payments: {
            paystackEnabled: true,
            paystackFee: 0.015,
            paystackMinAmount: 100,
            paystackMaxAmount: 1000000,
            bankTransferEnabled: true,
            bankTransferFee: 2500,
            bankTransferMinAmount: 1000,
            bankTransferMaxAmount: 5000000,
            withdrawalMinAmount: 500,
            withdrawalMaxAmount: 1000000,
            withdrawalFee: 0.01,
            instantWithdrawalEnabled: true,
          },
          gamification: {
            rankingsEnabled: true,
            weeklyBonusEnabled: true,
            topTipperBonus: 10000,
            secondTipperBonus: 7500,
            thirdTipperBonus: 5000,
            streakBonuses: {
              day3: 200,
              day7: 500,
              day14: 1000,
              day30: 2000,
            },
            achievementPoints: {
              firstTip: 50,
              challengeParticipant: 25,
              challengeCreator: 100,
              referralBonus: 300,
            },
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            whatsappEnabled: true,
            emailFromName: 'Givta',
            emailFromAddress: 'noreply@givta.com',
            smsFromNumber: '+2348100000000',
          },
          security: {
            kycRequired: true,
            kycForWithdrawalMinAmount: 50000,
            twoFactorRequired: false,
            twoFactorForWithdrawalMinAmount: 100000,
            maxLoginAttempts: 5,
            accountLockoutDuration: 15,
            sessionTimeout: 24 * 60 * 60 * 1000,
            passwordMinLength: 8,
            passwordRequireSpecialChars: true,
            passwordRequireNumbers: true,
            passwordRequireUppercase: true,
          },
          features: {
            challengesEnabled: true,
            sponsoredChallengesEnabled: true,
            tippingGoalsEnabled: true,
            LeaderboardsEnabled: true,
            referralsEnabled: true,
            gamificationEnabled: true,
            socialSharingEnabled: true,
            affiliateProgramEnabled: false,
          },
          limits: {
            maxChallengesPerUser: 10,
            maxChallengeParticipants: 1000,
            maxUserGoals: 20,
            maxSponsoredChallenges: 50,
            maxTipAttachments: 3,
            maxFileSizeMb: 10,
            maxTipPerChallenge: 100000,
          },
          gui: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            logoUrl: '/logo.png',
            faviconUrl: '/favicon.ico',
            appName: 'Givta',
            description: 'The future of social tipping',
            keywords: ['tipping', 'challenges', 'social', 'rewards', 'Nigeria'],
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'system'
        }
      ],

      notificationTemplates: [
        {
          id: 'welcome_email',
          name: 'Welcome Email',
          type: 'email',
          category: 'user',
          subject: 'Welcome to Givta! 🎉',
          content: `Welcome {{username}} to Givta!

Your account has been successfully created. Here's what you can do:

🎯 Create and participate in challenges
💰 Send and receive tips
🎖️ Climb the leaderboards
💬 Connect with friends

Get started now: {{appUrl}}

Best regards,
The Givta Team

---
This is an automated message. Please don't reply to this email.`,
          variables: ['username', 'appUrl'],
          active: true,
          defaultLanguage: 'en',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'system',
          updatedBy: 'system',
          usageCount: 0
        },
        {
          id: 'tip_received_push',
          name: 'Tip Received (Push)',
          type: 'push',
          category: 'transaction',
          title: 'You received a tip! 💰',
          content: '{{senderName}} sent you ₦{{amount}} for "{{challengeTitle}}"',
          variables: ['senderName', 'amount', 'challengeTitle'],
          active: true,
          defaultLanguage: 'en',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'system',
          updatedBy: 'system',
          usageCount: 0
        }
      ],

      maintenanceRecords: [
        {
          id: 'maint_database_cleanup',
          type: 'database',
          title: 'Database Cleanup',
          description: 'Automated cleanup of expired data and old logs',
          status: 'completed',
          scheduledStart: admin.firestore.FieldValue.serverTimestamp(),
          scheduledEnd: admin.firestore.FieldValue.serverTimestamp(),
          actualStart: admin.firestore.FieldValue.serverTimestamp(),
          actualEnd: admin.firestore.FieldValue.serverTimestamp(),
          affectedServices: ['firestore', 'systemLogs', 'kyc'],
          impact: 'low',
          notificationSent: true,
          createdBy: 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          notes: 'Successfully cleaned up expired KYC applications and old system logs.',
          backupBeforeMaintenance: true,
          backupFileId: 'backup_001'
        }
      ],

      supportTickets: [
        {
          id: 'ticket_cannot_tip',
          subject: 'Unable to send tips to friends',
          description: 'When trying to tip friends, the payment processing fails with error TIP500.',
          status: 'open',
          priority: 'high',
          category: 'technical',
          userId: 'user_john_doe',
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          userPhone: '+2348012345678',
          messageCount: 1,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessagePreview: 'When trying to tip friends...',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          id: 'ticket_reward_not_received',
          subject: 'Challenge rewards not received',
          description: 'I won a challenge but haven\'t received the prize money in my wallet.',
          status: 'in_progress',
          priority: 'medium',
          category: 'payment',
          userId: 'user_jane_smith',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@example.com',
          userPhone: '+2348023456789',
          assignedTo: 'admin_system',
          assignedName: 'System Admin',
          messageCount: 2,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessagePreview: 'I won a challenge but haven\'t received...',
          firstResponseAt: admin.firestore.FieldValue.serverTimestamp(),
          resolutionTime: 3 * 60 * 60 * 1000,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      ],

      supportMessages: [
        {
          id: 'msg_ticket_cannot_tip_1',
          ticketId: 'ticket_cannot_tip',
          message: 'I\'ve tried tipping in multiple challenges but keep getting error TIP500. The app says "Payment processing failed" but gives no other details.',
          senderId: 'user_john_doe',
          senderName: 'John Doe',
          senderEmail: 'john.doe@example.com',
          isAdmin: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          id: 'msg_ticket_reward_1',
          ticketId: 'ticket_reward_not_received',
          message: 'I won a challenge but haven\'t received the prize money in my wallet. Challenge ID: CHAL_789.',
          senderId: 'user_jane_smith',
          senderName: 'Jane Smith',
          senderEmail: 'jane.smith@example.com',
          isAdmin: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          id: 'msg_ticket_reward_admin',
          ticketId: 'ticket_reward_not_received',
          message: 'Thank you for reporting this issue. After checking the system, there was a delay in payment processing. The reward should now be credited to your account.',
          senderId: 'admin_system',
          senderName: 'System Admin',
          senderEmail: 'admin@givta.com',
          isAdmin: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      ],

      systemLogs: [
        {
          id: 'log_user_registration_john',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          level: 'info',
          message: 'New user registration: John Doe',
          service: 'auth',
          category: 'user',
          userId: 'user_john_doe',
          data: {
            user_email: 'john.doe@example.com',
            registration_time: new Date().toISOString()
          }
        },
        {
          id: 'log_kyc_verified_john',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          level: 'info',
          message: 'KYC application verified',
          service: 'kyc',
          category: 'verification',
          userId: 'user_john_doe',
          data: {
            kyc_id: 'kyc_john',
            document_type: 'national_id',
            verification_time: new Date().toISOString()
          }
        },
        {
          id: 'log_payment_success_john',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          level: 'info',
          message: 'Payment processed successfully',
          service: 'payments',
          category: 'transaction',
          userId: 'user_john_doe',
          data: {
            transaction_id: 'txn_deposit_1',
            amount: 5000,
            currency: 'NGN',
            provider: 'paystack'
          }
        }
      ]
    };

    // Add test data (only new documents, preserve existing data)
    console.log('📝 Populating collections (preserving existing data)...');

    for (const [collectionName, documents] of Object.entries(testData)) {
      console.log(`📝 Checking ${documents.length} documents in ${collectionName}...`);

      for (const document of documents) {
        // Skip documents with invalid IDs
        if (!document.id || typeof document.id !== 'string' || document.id.trim() === '') {
          console.log(`⚠️  Skipped document in ${collectionName} - invalid ID: ${document.id}`);
          continue;
        }

        const docRef = db.collection(collectionName).doc(document.id);
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
          console.log(`⏭️  Skipped ${document.id} (already exists in ${collectionName})`);
        } else {
          await docRef.set(document);
          console.log(`✅ Added ${document.id} to ${collectionName}`);
        }
      }
    }

    console.log('🎉 Collections population completed successfully (existing data preserved)!');
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
    console.log('\n🏆 Challenge Testing:');
    console.log('Challenges available:');
    console.log('• John\'s Birthday Celebration (Active) - givta.app/challenge/john-birthday');
    console.log('• Jane\'s Fitness Challenge (Running) - givta.app/challenge/jane-fitness');
    console.log('• Tech Content Challenge (Completed) - givta.app/challenge/tech-content');

    // Update existing users with ranking fields
    await updateExistingUsersWithRankingFields();

  } catch (error) {
    console.error('❌ Error populating collections:', error);
  }
}

// Update existing users with ranking fields
async function updateExistingUsersWithRankingFields() {
  console.log('👥 Updating existing users with ranking fields...');

  try {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('👀 No existing users found to update');
      return true;
    }

    const batch = db.batch();
    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      let needsUpdate = false;

      // Add weekly ranking tracking
      if (!userData.weeklyRanking) {
        userData.weeklyRanking = {
          bestRank: 0,
          currentRank: 0,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };
        needsUpdate = true;
      }

      // Add bonus and achievement tracking
      if (userData.totalWeeklyBonuses === undefined) {
        userData.totalWeeklyBonuses = 0;
        needsUpdate = true;
      }

      if (userData.achievementCount === undefined) {
        userData.achievementCount = 0;
        needsUpdate = true;
      }

      if (userData.currentStreak === undefined) {
        userData.currentStreak = 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc.ref, {
          weeklyRanking: userData.weeklyRanking,
          totalWeeklyBonuses: userData.totalWeeklyBonuses || 0,
          achievementCount: userData.achievementCount || 0,
          currentStreak: userData.currentStreak || 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updatedCount} existing users with ranking fields!`);
    } else {
      console.log('👌 All users already have ranking fields');
    }

    return true;
  } catch (error) {
    console.error('❌ Error updating existing users:', error);
    return false;
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
