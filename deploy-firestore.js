#!/usr/bin/env node

/**
 * Firestore Deployment Script for Givta App
 *
 * This script deploys Firestore security rules and indexes to Firebase.
 *
 * Prerequisites:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Initialize project: firebase init (if not already done)
 * 4. Set correct project: firebase use your-project-id
 *
 * Usage:
 * node deploy-firestore.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Deploying Givta Firestore Collections...\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI is not installed');
  console.log('Please install Firebase CLI: npm install -g firebase-tools');
  process.exit(1);
}

// Check if we're in the right directory
const firestoreRulesPath = path.join(__dirname, 'firestore.rules');
const firestoreIndexesPath = path.join(__dirname, 'firestore.indexes.json');

if (!fs.existsSync(firestoreRulesPath)) {
  console.error('❌ firestore.rules file not found');
  process.exit(1);
}

if (!fs.existsSync(firestoreIndexesPath)) {
  console.error('❌ firestore.indexes.json file not found');
  process.exit(1);
}

console.log('📋 Found deployment files:');
console.log('   - firestore.rules');
console.log('   - firestore.indexes.json\n');

// Check Firebase project configuration
try {
  const firebaseConfig = execSync('firebase projects:list --json', { encoding: 'utf8' });
  console.log('✅ Firebase project configured');
} catch (error) {
  console.error('❌ Firebase project not configured');
  console.log('Please run: firebase use your-project-id');
  process.exit(1);
}

console.log('🚀 Starting deployment...\n');

// Deploy Firestore security rules
console.log('🔒 Deploying Firestore security rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore security rules deployed successfully');
} catch (error) {
  console.error('❌ Failed to deploy Firestore security rules');
  console.error(error.message);
  process.exit(1);
}

// Deploy Firestore indexes
console.log('\n📊 Deploying Firestore indexes...');
try {
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('✅ Firestore indexes deployed successfully');
} catch (error) {
  console.error('❌ Failed to deploy Firestore indexes');
  console.error(error.message);
  process.exit(1);
}

console.log('\n🎉 Deployment completed successfully!');
console.log('\n📊 Deployment Summary:');
console.log('   - Security Rules: ✅ Deployed');
console.log('   - Database Indexes: ✅ Deployed');
console.log('   - Collections: Ready for use');

console.log('\n🔍 Next Steps:');
console.log('   1. Verify deployment in Firebase Console');
console.log('   2. Test app functionality');
console.log('   3. Monitor Firestore usage and performance');

console.log('\n📚 Useful Commands:');
console.log('   - View rules: firebase firestore:rules:list');
console.log('   - View indexes: firebase firestore:indexes:list');
console.log('   - Monitor usage: Firebase Console → Firestore → Usage');

console.log('\n✨ Givta Firestore collections are now live and ready for production use!');
