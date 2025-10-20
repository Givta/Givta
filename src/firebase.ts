// Import both web and React Native Firebase
import { initializeApp } from 'firebase/app';
import firebase from 'firebase/app';

// Import web Firebase services
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { config, firebaseConfig } from './config';

// Initialize Firebase (web version for compatibility)
const app = initializeApp(firebaseConfig);

// Use web Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Try to load React Native Firebase messaging dynamically
let messagingInstance: any = null;

try {
  // Try React Native Firebase messaging first (if installed)
  const rnFirebaseMessaging = require('@react-native-firebase/messaging');
  if (rnFirebaseMessaging && rnFirebaseMessaging.default) {
    messagingInstance = rnFirebaseMessaging.default;
    console.log('✅ React Native Firebase Messaging loaded');
  } else {
    // Fall back to web Firebase messaging
    const { getMessaging } = require('firebase/messaging');
    messagingInstance = getMessaging(app);
    console.log('✅ Web Firebase Messaging loaded');
  }
} catch (error: any) {
  console.log('📱 Firebase Messaging not available:', error.message);
}

export { messagingInstance as messaging };

// For additional React Native Firebase support (when installed), you can add:
// import messaging from '@react-native-firebase/messaging';
// export const rnMessaging = messaging;

// Firebase Analytics (if needed)
// export const analytics = getAnalytics(app);

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Firebase emulator setup for development
export const connectToEmulators = () => {
  if (config.app.environment === 'development' && config.firebase.useEmulator) {
    console.log('🔥 Connecting to Firebase emulators...');

    // Note: Firebase emulators for React Native require additional setup
    // This is primarily for web development
    /*
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    */
  }
};

// Initialize emulators if in development
connectToEmulators();

export default app;
