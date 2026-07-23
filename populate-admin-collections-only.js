#!/usr/bin/env node

/**
 * Populate Admin Dashboard Collections ONLY
 * Adds ONLY the new admin collections without touching existing data
 */

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const backendRoot = path.resolve(__dirname, '..', 'backend');
const requireFromBackend = createRequire(path.join(backendRoot, 'package.json'));
const admin = requireFromBackend('firebase-admin');
const { Timestamp } = requireFromBackend('firebase-admin/firestore');

// Initialize Firebase Admin SDK
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

console.log('🚀 Populating ADMIN COLLECTIONS ONLY...\n');

async function populateAdminCollections() {
  try {
    // Check for service account file
    const backendRoot = path.join(__dirname, '..', 'backend');
    const serviceAccountPath = path.join(backendRoot, 'firebase-service-account.json');
    const envPath = path.join(backendRoot, '.env');

    let credential;
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (error) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', error.message);
        process.exit(1);
      }
    } else if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      credential = admin.credential.applicationDefault();
    }

    if (!serviceAccount && !credential) {
      console.error('❌ Firebase credentials not found.');
      console.log('Provide one of the following:');
      console.log('• backend/firebase-service-account.json');
      console.log('• FIREBASE_SERVICE_ACCOUNT_JSON');
      console.log('• GOOGLE_APPLICATION_CREDENTIALS pointing to a valid credential file');
      process.exit(1);
    }

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'givta-94cb8';
      credential = credential || admin.credential.cert(serviceAccount);

      admin.initializeApp({
        credential,
        projectId
      });
    }

    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });

    // Only populate NEW admin collections (skip existing user data)
    console.log('📝 Creating admin system settings...');

    // 1. System Settings (Default configuration)
    const systemSettingsData = {
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: 'system'
    };

    const settingsRef = db.collection('systemSettings').doc('system_settings');
    const settingsExists = (await settingsRef.get()).exists;

    if (!settingsExists) {
      await settingsRef.set(systemSettingsData);
      console.log('✅ System settings created');
    } else {
      console.log('⏭️  System settings already exist (skipped)');
    }

    console.log('📧 Creating notification templates...');

    // 2. Notification Templates
    const existingTemplates = new Set();
    const templatesSnapshot = await db.collection('notificationTemplates').get();
    templatesSnapshot.forEach(doc => existingTemplates.add(doc.id));

    const notificationTemplates = [
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'system',
        updatedBy: 'system',
        usageCount: 0
      },
      {
        id: 'challenge_ended_email',
        name: 'Challenge Ended Email',
        type: 'email',
        category: 'challenge',
        subject: 'Challenge "{{challengeTitle}}" has ended',
        content: `Hi {{username}},

The challenge "{{challengeTitle}}" you participated in has ended!

📊 Results:
🏆 Winner: {{winnerName}}
💰 Prize Pool: ₦{{totalPrize}}
🫵 Your Rank: {{yourRank}}

Thank you for participating!

View full results: {{challengeUrl}}

Best regards,
The Givta Team`,
        variables: ['username', 'challengeTitle', 'winnerName', 'totalPrize', 'yourRank', 'challengeUrl'],
        active: true,
        defaultLanguage: 'en',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'system',
        updatedBy: 'system',
        usageCount: 0
      }
    ];

    let templatesCreated = 0;
    for (const template of notificationTemplates) {
      if (!existingTemplates.has(template.id)) {
        await db.collection('notificationTemplates').doc(template.id).set(template);
        templatesCreated++;
      }
    }

    console.log(`✅ Created ${templatesCreated} notification templates (${existingTemplates.size} already existed)`);

    console.log('🔧 Creating sample maintenance records...');

    // 3. Sample Maintenance Records (for demo purposes)
    const maintenanceRecords = [
      {
        id: 'maint_initial_setup',
        type: 'deployment',
        title: 'Admin Dashboard Initial Setup',
        description: 'Initial deployment of the complete admin dashboard system with all monitoring and management features',
        status: 'completed',
        scheduledStart: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        scheduledEnd: Timestamp.now(),
        actualStart: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        actualEnd: Timestamp.now(),
        affectedServices: ['admin-dashboard', 'api', 'firestore', 'authentication'],
        impact: 'low',
        notificationSent: false,
        createdBy: 'system',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        updatedAt: Timestamp.now(),
        notes: 'Successfully deployed production-grade admin dashboard with KYC verification, system monitoring, support tickets, user management, and sponsored challenges oversight.',
        backupBeforeMaintenance: true,
        backupFileId: 'backup_admin_initial'
      }
    ];

    const existingMaintenance = new Set();
    const maintenanceSnapshot = await db.collection('maintenanceRecords').get();
    maintenanceSnapshot.forEach(doc => existingMaintenance.add(doc.id));

    let maintenanceRecordsCreated = 0;
    for (const record of maintenanceRecords) {
      if (!existingMaintenance.has(record.id)) {
        await db.collection('maintenanceRecords').doc(record.id).set(record);
        maintenanceRecordsCreated++;
      }
    }

    console.log(`✅ Created ${maintenanceRecordsCreated} maintenance records (${existingMaintenance.size} already existed)`);

    console.log('🎫 Creating sample support tickets...');

    // 4. Sample Support Tickets (for admin training)
    const supportTickets = [
      {
        id: 'support_welcome_ticket',
        subject: 'Welcome to Givta Support System',
        description: 'This is a sample support ticket to demonstrate the admin dashboard features. You can view messages, change status, assign tickets, and manage the complete customer support workflow.',
        status: 'open',
        priority: 'low',
        category: 'general',
        userId: 'demo_admin_user',
        userName: 'Demo User',
        userEmail: 'demo@givta.com',
        messageCount: 1,
        lastMessagePreview: 'This is a sample support ticket to demonstrate...',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      }
    ];

    const existingTickets = new Set();
    const ticketsSnapshot = await db.collection('supportTickets').get();
    ticketsSnapshot.forEach(doc => existingTickets.add(doc.id));

    let ticketsCreated = 0;
    for (const ticket of supportTickets) {
      if (!existingTickets.has(ticket.id)) {
        await db.collection('supportTickets').doc(ticket.id).set(ticket);
        ticketsCreated++;
      }
    }

    console.log(`✅ Created ${ticketsCreated} sample support tickets (${existingTickets.size} already existed)`);

    // Create sample ticket messages
    const supportMessages = [
      {
        id: 'msg_welcome_001',
        ticketId: 'support_welcome_ticket',
        message: 'Welcome to the Givta support system! This ticket demonstrates how admins can manage customer inquiries. You can reply to this message, change the ticket status, and assign it to different admins.',
        senderId: 'demo_admin_user',
        senderName: 'Demo User',
        senderEmail: 'demo@givta.com',
        isAdmin: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      }
    ];

    const existingMessages = new Set();
    const messagesSnapshot = await db.collection('supportMessages').get();
    messagesSnapshot.forEach(doc => existingMessages.add(doc.id));

    let messagesCreated = 0;
    for (const message of supportMessages) {
      if (!existingMessages.has(message.id)) {
        await db.collection('supportMessages').doc(message.id).set(message);
        messagesCreated++;
      }
    }

    console.log(`✅ Created ${messagesCreated} sample support messages (${existingMessages.size} already existed)`);

    console.log('📊 Creating initial system logs...');

    // 5. Initial System Logs (deployment history)
    const systemLogs = [
      {
        id: 'log_system_startup',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        level: 'info',
        message: 'Admin Dashboard system initialized successfully',
        service: 'admin-dashboard',
        category: 'system',
        data: {
          version: '1.0.0',
          collections: ['systemLogs', 'supportTickets', 'supportMessages', 'systemSettings', 'notificationTemplates', 'maintenanceRecords'],
          features: ['KYC Management', 'User Oversight', 'System Monitoring', 'Support Tickets', 'Challenge Approval']
        }
      },
      {
        id: 'log_collections_created',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 90 * 1000)), // 1.5 minutes ago
        level: 'info',
        message: 'Admin collections created and populated with initial data',
        service: 'firestore',
        category: 'database',
        data: {
          collectionsCreated: ['systemLogs', 'supportTickets', 'supportMessages', 'systemSettings', 'notificationTemplates', 'maintenanceRecords'],
          recordsCreated: {
            supportTickets: ticketsCreated,
            supportMessages: messagesCreated,
            notificationTemplates: templatesCreated,
            maintenanceRecords: maintenanceRecordsCreated
          }
        }
      }
    ];

    const existingLogs = new Set();
    const logsSnapshot = await db.collection('systemLogs').get();
    logsSnapshot.forEach(doc => existingLogs.add(doc.id));

    let logsCreated = 0;
    for (const log of systemLogs) {
      if (!existingLogs.has(log.id)) {
        await db.collection('systemLogs').doc(log.id).set(log);
        logsCreated++;
      }
    }

    console.log(`✅ Created ${logsCreated} initial system logs (${existingLogs.size} already existed)`);

    console.log('\n🎉 Admin collections population COMPLETED!');
    console.log('✅ ALL EXISTING USER DATA WAS PRESERVED');
    console.log('\n📊 Admin Dashboard Ready For Use:');
    console.log('• System Settings configured');
    console.log('• Notification Templates ready');
    console.log('• Maintenance tracking active');
    console.log('• Support ticket system initialized');
    console.log('• System logging operational');
    console.log('• Complete audit trails enabled');

    console.log('\n🚀 Admin Dashboard Features Now Available:');
    console.log('1. 📋 Dashboard Overview - Real metrics and statistics');
    console.log('2. 👥 User Management - Full CRUD with KYC oversight');
    console.log('3. 🔍 KYC Applications - Document review and approval');
    console.log('4. 🎫 Support Tickets - Customer service management');
    console.log('5. 💰 Sponsored Challenges - Proposal review and approval');
    console.log('6. 📊 System Logs - Comprehensive monitoring & filtering');
    console.log('7. ⚙️ Settings Management - Platform configuration');
    console.log('8. 📧 Template Management - Customizable messaging');

    console.log('\n🔐 Admin Access:');
    console.log('Navigate to /admin in your app!');
    console.log('(Admin authentication required)');

  } catch (error) {
    console.error('❌ Error populating admin collections:', error);
    process.exit(1);
  }
}

// Run the population script
populateAdminCollections().then(() => {
  console.log('\n✅ Admin collections population script completed successfully!');
  console.log('🎯 EXISTING USER DATA WAS COMPLETELY PRESERVED');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Admin collections population script failed:', error);
  process.exit(1);
});
