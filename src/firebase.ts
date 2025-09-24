import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import { config, firebaseConfig } from './config';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging for web
let messaging: any = null;
try {
  // Try to initialize messaging - will work in web environments
  messaging = getMessaging(app);
  console.log('✅ Firebase Messaging initialized');
} catch (error: any) {
  console.log('📱 Firebase Messaging not available in this environment:', error.message);
}

export { messaging };

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
