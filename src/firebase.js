"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToEmulators = exports.isFirebaseConfigured = exports.messaging = exports.storage = exports.db = exports.auth = void 0;
// Import both web and React Native Firebase
const app_1 = require("firebase/app");
// Import web Firebase services
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
const config_1 = require("./config");
// Initialize Firebase (web version for compatibility)
const app = (0, app_1.initializeApp)(config_1.firebaseConfig);
// Use web Firebase services
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.storage = (0, storage_1.getStorage)(app);
// Try to load React Native Firebase messaging dynamically
let messagingInstance = null;
exports.messaging = messagingInstance;
try {
    // Try React Native Firebase messaging first (if installed)
    const rnFirebaseMessaging = require('@react-native-firebase/messaging');
    if (rnFirebaseMessaging && rnFirebaseMessaging.default) {
        exports.messaging = messagingInstance = rnFirebaseMessaging.default;
        console.log('✅ React Native Firebase Messaging loaded');
    }
    else {
        // Fall back to web Firebase messaging
        const { getMessaging } = require('firebase/messaging');
        exports.messaging = messagingInstance = getMessaging(app);
        console.log('✅ Web Firebase Messaging loaded');
    }
}
catch (error) {
    console.log('📱 Firebase Messaging not available:', error.message);
}
// For additional React Native Firebase support (when installed), you can add:
// import messaging from '@react-native-firebase/messaging';
// export const rnMessaging = messaging;
// Firebase Analytics (if needed)
// export const analytics = getAnalytics(app);
// Helper function to check if Firebase is properly configured
const isFirebaseConfigured = () => {
    return !!(config_1.firebaseConfig.apiKey &&
        config_1.firebaseConfig.authDomain &&
        config_1.firebaseConfig.projectId &&
        config_1.firebaseConfig.storageBucket &&
        config_1.firebaseConfig.messagingSenderId &&
        config_1.firebaseConfig.appId);
};
exports.isFirebaseConfigured = isFirebaseConfigured;
// Firebase emulator setup for development
const connectToEmulators = () => {
    if (config_1.config.app.environment === 'development' && config_1.config.firebase.useEmulator) {
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
exports.connectToEmulators = connectToEmulators;
// Initialize emulators if in development
(0, exports.connectToEmulators)();
exports.default = app;
//# sourceMappingURL=firebase.js.map