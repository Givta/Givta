"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlags = exports.appConfig = exports.apiConfig = exports.paystackConfig = exports.firebaseConfig = exports.errors = exports.isValid = exports.config = void 0;
// Default configuration values
const defaultConfig = {
    firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
        vapidKey: '',
        useEmulator: false,
    },
    paystack: {
        publicKey: '',
        secretKey: '',
    },
    api: {
        // IMPORTANT: For mobile development, 'localhost' will not work.
        // You must use your computer's local network IP address.
        // Set this in your .env file using EXPO_PUBLIC_API_BASE_URL.
        baseURL: 'http://localhost:5000/api',
        backendURL: 'http://localhost:5000',
        timeout: 15000,
    },
    app: {
        name: 'Givta',
        version: '1.0.0',
        environment: 'development',
        supportEmail: 'support@givta.app, givtamanager@gmail.com',
        whatsappNumber: '+234 813 927 0820',
    },
    features: {
        analytics: true,
        pushNotifications: true,
        referralSystem: true,
        tipping: true,
    },
    security: {
        encryptionKey: '',
    },
    thirdParty: {},
};
// Load configuration from environment variables
const loadConfig = () => {
    const config = { ...defaultConfig };
    // Firebase configuration
    config.firebase = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
        useEmulator: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
    };
    // Paystack configuration
    config.paystack = {
        publicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        secretKey: process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '',
    };
    // API configuration
    config.api = {
        baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || defaultConfig.api.baseURL,
        backendURL: process.env.EXPO_PUBLIC_BACKEND_URL || defaultConfig.api.backendURL,
        timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000'),
    };
    // App configuration
    config.app = {
        name: process.env.EXPO_PUBLIC_APP_NAME || defaultConfig.app.name,
        version: process.env.EXPO_PUBLIC_APP_VERSION || defaultConfig.app.version,
        environment: process.env.EXPO_PUBLIC_ENVIRONMENT || defaultConfig.app.environment,
        supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || defaultConfig.app.supportEmail,
        whatsappNumber: process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || defaultConfig.app.whatsappNumber,
    };
    // Feature flags
    config.features = {
        analytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS !== 'false',
        pushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS !== 'false',
        referralSystem: process.env.EXPO_PUBLIC_ENABLE_REFERRAL_SYSTEM !== 'false',
        tipping: process.env.EXPO_PUBLIC_ENABLE_TIPPING !== 'false',
    };
    // Security
    config.security = {
        encryptionKey: process.env.EXPO_PUBLIC_ENCRYPTION_KEY || '',
    };
    // Third-party services
    config.thirdParty = {
        sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
        mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
    };
    // Development settings
    if (config.app.environment === 'development') {
        config.development = {
            debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
            logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'debug',
        };
    }
    // Production settings
    if (config.app.environment === 'production') {
        config.production = {
            cacheEnabled: process.env.EXPO_PUBLIC_CACHE_ENABLED !== 'false',
            imageOptimization: process.env.EXPO_PUBLIC_IMAGE_OPTIMIZATION !== 'false',
            offlineMode: process.env.EXPO_PUBLIC_OFFLINE_MODE !== 'false',
            errorReporting: process.env.EXPO_PUBLIC_ERROR_REPORTING !== 'false',
            performanceMonitoring: process.env.EXPO_PUBLIC_PERFORMANCE_MONITORING !== 'false',
        };
    }
    return config;
};
// Validate configuration
const validateConfig = (config) => {
    const errors = [];
    // For development, be less strict with validation
    if (config.app.environment === 'development') {
        // Only check for critical missing values in development
        if (!config.api.baseURL || config.api.baseURL.includes('localhost')) {
            errors.push('API base URL should be set to your local network IP for mobile development');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    // Strict validation for production
    // Firebase validation
    if (!config.firebase.apiKey)
        errors.push('Firebase API key is required');
    if (!config.firebase.projectId)
        errors.push('Firebase project ID is required');
    if (!config.firebase.appId)
        errors.push('Firebase app ID is required');
    // Paystack validation
    if (!config.paystack.publicKey)
        errors.push('Paystack public key is required');
    // API validation
    if (!config.api.baseURL)
        errors.push('API base URL is required');
    // Security validation
    if (!config.security.encryptionKey)
        errors.push('Encryption key is required');
    return {
        isValid: errors.length === 0,
        errors,
    };
};
// Export configuration
exports.config = loadConfig();
_a = validateConfig(exports.config), exports.isValid = _a.isValid, exports.errors = _a.errors;
// Log configuration status
if (exports.config.app.environment === 'development') {
    console.log('🔧 App Configuration:', {
        environment: exports.config.app.environment,
        firebaseConfigured: !!exports.config.firebase.apiKey,
        paystackConfigured: !!exports.config.paystack.publicKey,
        apiConfigured: !!exports.config.api.baseURL,
        isValid: exports.isValid,
        errors: exports.errors.length > 0 ? exports.errors : undefined,
    });
}
// Export individual config sections for convenience
exports.firebaseConfig = exports.config.firebase;
exports.paystackConfig = exports.config.paystack;
exports.apiConfig = exports.config.api;
exports.appConfig = exports.config.app;
exports.featureFlags = exports.config.features;
exports.default = exports.config;
//# sourceMappingURL=index.js.map