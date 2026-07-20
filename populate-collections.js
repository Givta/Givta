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
  FEEDBACK: 'feedback'
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
        // Deposits
        {
          id: 'txn_deposit_1',
          userId: 'user_john_doe',
          type: 'deposit',
          amount: 10000,
          description: 'Wallet funding via Paystack',
          status: 'completed',
          reference: 'DEP_001',
          recipientId: null,
          senderId: null,
          paymentMethod: 'paystack',
          currency: 'NGN',
          fee: 0,
          netAmount: 10000,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            paystackReference: 'ref_12345'
          }
        },
        {
          id: 'txn_deposit_2',
          userId: 'user_jane_smith',
          type: 'deposit',
          amount: 5000,
          description: 'Wallet funding via Paystack',
          status: 'completed',
          reference: 'DEP_002',
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
            paystackReference: 'ref_23456'
          }
        },

        // Admin bonus credits (recent bonuses)
        {
          id: 'bonus_admin_john_1',
          userId: 'user_john_doe',
          type: 'deposit',
          amount: 2000,
          description: 'Weekly challenge winner bonus',
          status: 'completed',
          reference: 'BONUS_ADMIN_001',
          recipientId: null,
          senderId: null,
          paymentMethod: 'admin_credit',
          currency: 'NGN',
          fee: 0,
          netAmount: 2000,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            creditedBy: 'admin_system',
            creditedAt: new Date()
          }
        },
        {
          id: 'bonus_admin_jane_1',
          userId: 'user_jane_smith',
          type: 'deposit',
          amount: 1500,
          description: 'Referral milestone bonus',
          status: 'completed',
          reference: 'BONUS_ADMIN_002',
          recipientId: null,
          senderId: null,
          paymentMethod: 'admin_credit',
          currency: 'NGN',
          fee: 0,
          netAmount: 1500,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            creditedBy: 'admin_system',
            creditedAt: new Date()
          }
        },
        {
          id: 'bonus_admin_john_2',
          userId: 'user_john_doe',
          type: 'deposit',
          amount: 1000,
          description: 'Top tipper bonus',
          status: 'completed',
          reference: 'BONUS_ADMIN_003',
          recipientId: null,
          senderId: null,
          paymentMethod: 'admin_credit',
          currency: 'NGN',
          fee: 0,
          netAmount: 1000,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            creditedBy: 'admin_system',
            creditedAt: new Date()
          }
        },

        // Tips - John is top tipper
        {
          id: 'txn_tip_john_jane_1',
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
          id: 'txn_tip_john_bob_1',
          userId: 'user_john_doe',
          type: 'tip_sent',
          amount: 800,
          description: 'Tip sent to Bob Wilson',
          status: 'completed',
          reference: 'TIP_002',
          recipientId: 'user_bob_wilson',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 16,
          netAmount: 784,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            tipDetails: {
              message: 'Keep it up!',
              isAnonymous: false
            },
            whatsappMessageId: 'msg_124'
          }
        },
        {
          id: 'txn_tip_john_jane_2',
          userId: 'user_john_doe',
          type: 'tip_sent',
          amount: 600,
          description: 'Tip sent to Jane Smith',
          status: 'completed',
          reference: 'TIP_003',
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 12,
          netAmount: 588,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            tipDetails: {
              message: 'Amazing content!',
              isAnonymous: false
            },
            whatsappMessageId: 'msg_125'
          }
        },

        // Tips received - Jane is top receiver
        {
          id: 'txn_tip_received_jane_1',
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
        },
        {
          id: 'txn_tip_received_jane_2',
          userId: 'user_jane_smith',
          type: 'tip_received',
          amount: 588,
          description: 'Tip received from John Doe',
          status: 'completed',
          reference: 'TIP_003',
          recipientId: 'user_jane_smith',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 0,
          netAmount: 588,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            tipDetails: {
              message: 'Amazing content!',
              isAnonymous: false
            }
          }
        },
        {
          id: 'txn_tip_received_bob_1',
          userId: 'user_bob_wilson',
          type: 'tip_received',
          amount: 784,
          description: 'Tip received from John Doe',
          status: 'completed',
          reference: 'TIP_002',
          recipientId: 'user_bob_wilson',
          senderId: 'user_john_doe',
          paymentMethod: null,
          currency: 'NGN',
          fee: 0,
          netAmount: 784,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            tipDetails: {
              message: 'Keep it up!',
              isAnonymous: false
            }
          }
        },

        // Referral bonuses - John has referral bonuses
        {
          id: 'txn_referral_bonus_john',
          userId: 'user_john_doe',
          type: 'referral_bonus',
          amount: 100,
          description: 'Referral bonus for level 1 referral (locked until ₦1,500 threshold reached)',
          status: 'completed',
          reference: 'REF_BONUS_001',
          recipientId: null,
          senderId: null,
          paymentMethod: null,
          currency: 'NGN',
          fee: 0,
          netAmount: 0, // Not available for withdrawal yet
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            referredId: 'user_jane_smith',
            level: 1,
            referralDetails: {
              level: 1,
              referrerId: 'user_john_doe'
            }
          }
        },

        // Withdrawals with bank details (including bankName)
        {
          id: 'txn_withdrawal_john_1',
          userId: 'user_john_doe',
          type: 'withdrawal',
          amount: -1000,
          description: 'Withdrawal to GTBank account - Admin will process manually',
          status: 'completed',
          reference: 'WDR_001',
          recipientId: null,
          senderId: null,
          paymentMethod: 'bank_transfer',
          currency: 'NGN',
          fee: 23,
          netAmount: -1023,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            bankDetails: {
              accountNumber: '0123456789',
              bankCode: '058',
              accountName: 'John Doe',
              bankName: 'GTBank'
            }
          }
        },
        {
          id: 'txn_withdrawal_jane_1',
          userId: 'user_jane_smith',
          type: 'withdrawal',
          amount: -500,
          description: 'Withdrawal to Access Bank account - Admin will process manually',
          status: 'completed',
          reference: 'WDR_002',
          recipientId: null,
          senderId: null,
          paymentMethod: 'bank_transfer',
          currency: 'NGN',
          fee: 23,
          netAmount: -523,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            bankDetails: {
              accountNumber: '1234567890',
              bankCode: '044',
              accountName: 'Jane Smith',
              bankName: 'Access Bank'
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

      // Application Notifications (for wallet screen display)
      applicationNotifications: [
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'admin'
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
      ],

      // Feedback collection - User feedback and ratings
      feedback: [
        {
          id: 'feedback_bug_report_001',
          userId: 'user_john_doe',
          userEmail: 'john.doe@example.com',
          type: 'bug_report',
          rating: 2,
          subject: 'App crashes when sending tips',
          message: 'The app crashes every time I try to send a tip to someone. This happens on both WiFi and mobile data. I have to restart the app each time.',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_feature_request_001',
          userId: 'user_jane_smith',
          userEmail: 'jane.smith@example.com',
          type: 'feature_request',
          rating: 4,
          subject: 'Dark mode toggle',
          message: 'I would love to have a dark mode option in the app. It would be much easier on the eyes, especially at night. Maybe add it to the settings menu?',
          status: 'reviewed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_ui_improvement_001',
          userId: 'user_bob_wilson',
          userEmail: 'bob.wilson@example.com',
          type: 'ui_improvement',
          rating: 3,
          subject: 'Button text is too small',
          message: 'The text on some buttons is quite small and hard to read. Could you make the font size a bit larger? Especially the "Send Tip" button.',
          status: 'resolved',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_performance_001',
          userId: 'user_john_doe',
          userEmail: 'john.doe@example.com',
          type: 'performance',
          rating: 1,
          subject: 'App loads very slowly',
          message: 'The app takes forever to load when I open it. Sometimes it freezes for 10-15 seconds before I can use any features. This is really frustrating.',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_general_001',
          userId: 'user_jane_smith',
          userEmail: 'jane.smith@example.com',
          type: 'general_feedback',
          rating: 5,
          subject: 'Love the tipping concept!',
          message: 'I really love how Givta makes it easy to support content creators and friends. The interface is intuitive and the tipping process is smooth. Great job!',
          status: 'resolved',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_other_001',
          userId: 'user_bob_wilson',
          userEmail: 'bob.wilson@example.com',
          type: 'other',
          rating: 4,
          subject: 'Customer Support',
          message: 'I had an issue with my wallet balance not updating correctly. I contacted support and they resolved it quickly. Very impressed with the response time!',
          status: 'reviewed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_bug_report_002',
          userId: 'user_jane_smith',
          userEmail: 'jane.smith@example.com',
          type: 'bug_report',
          rating: 3,
          subject: 'Notifications not working',
          message: 'I\'m not receiving push notifications when someone sends me a tip. I\'ve checked my settings and everything seems correct. This started happening after the last update.',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          id: 'feedback_feature_request_002',
          userId: 'user_john_doe',
          userEmail: 'john.doe@example.com',
          type: 'feature_request',
          rating: 4,
          subject: 'Tip history export',
          message: 'It would be great if I could export my tip history to CSV or PDF format. This would help with tax purposes and keeping track of my giving activities.',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    console.log('\n💬 Feedback Testing:');
    console.log('8 sample feedback entries created for testing admin dashboard');
    console.log('• Bug reports, feature requests, UI improvements, performance issues');
    console.log('• Different statuses: pending, reviewed, resolved');
    console.log('• Various ratings from 1-5 stars');
    console.log('• Access via Admin Dashboard > Support > User Feedback tab');

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
