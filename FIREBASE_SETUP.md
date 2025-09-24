# Firebase Setup Guide for Givta App

This guide will help you set up Firebase for the Givta React Native application.

## 📋 Prerequisites

1. **Firebase Account**: Create a Firebase account at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Node.js**: Ensure you have Node.js installed
3. **Expo CLI**: Install Expo CLI globally

## 🚀 Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `givta-prod` (for production) or `givta-dev` (for development)
4. Choose whether to enable Google Analytics (recommended for production)
5. Click "Create project"

### Step 2: Enable Required Services

#### Authentication
1. In your Firebase project, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. (Optional) Enable other providers like Google, Phone, etc.

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (you can change security rules later)
4. Select a location for your database (choose one close to your users)

#### Storage (Optional - for file uploads)
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Set up security rules as needed

#### Cloud Messaging (for Push Notifications)
1. Go to **Cloud Messaging**
2. This will be automatically configured when you set up Firebase

## 🔧 Firebase Configuration

### Step 3: Get Firebase Config

#### For Web/App Configuration:
1. In your Firebase project, click the gear icon → **Project settings**
2. Scroll down to "Your apps" section
3. Click "Add app" → Choose the web icon (`</>`)
4. Register your app with name: `Givta Web App`
5. Copy the Firebase configuration object

#### For Android (google-services.json):
1. In Firebase Console, go to **Project settings**
2. In "Your apps" section, click **Add app**
3. Choose the Android icon
4. Enter your Android package name: `com.givta.app` (or your actual package name)
5. Download the `google-services.json` file
6. Place it in the `givta/` directory (replace the existing one)
7. The file will be automatically included in Android builds

#### For iOS (GoogleService-Info.plist):
1. In Firebase Console, go to **Project settings**
2. In "Your apps" section, click **Add app**
3. Choose the iOS icon
4. Enter your iOS bundle ID
5. Download the `GoogleService-Info.plist` file
6. Place it in the `givta/ios/Givta/` directory
7. The file will be automatically included in iOS builds

### Step 4: Environment Variables Setup

#### For Development:
1. Copy `.env.development` to `.env`
2. Update the Firebase configuration values:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_from_firebase
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### For Production:
1. Create a new Firebase project for production
2. Repeat steps 1-3 above
3. Update `.env.production` with production values

### Step 5: Android Configuration (google-services.json)

The `google-services.json` file is required for Android builds and Firebase integration:

#### Development Setup:
1. Download `google-services.json` from your **development** Firebase project
2. Place it in the `givta/` directory
3. This file will be used for development builds

#### Production Setup:
1. Download `google-services.json` from your **production** Firebase project
2. Replace the development version with the production version
3. Ensure the package name matches your app's package name

#### File Structure:
```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "your-project-id",
    "storage_bucket": "your-project-id.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:PROJECT_NUMBER:android:ANDROID_APP_ID",
        "android_client_info": {
          "package_name": "com.givta.app"
        }
      }
    }
  ]
}
```

**Important Notes:**
- Never commit the actual `google-services.json` to version control
- Use different Firebase projects for development and production
- The template file `google-services.json.example` shows the expected structure
- Update the package name to match your actual Android app package name

## 🔑 Firebase Security Rules

### Firestore Security Rules

Create `firestore.rules` in your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read and write their own wallets
    match /wallets/{walletId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Users can read and write their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Users can read their own referrals
    match /referrals/{referralId} {
      allow read: if request.auth != null &&
        (resource.data.referrerId == request.auth.uid ||
         resource.data.referredId == request.auth.uid);
      allow write: if request.auth != null &&
        resource.data.referrerId == request.auth.uid;
    }

    // Users can read and write their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Tips security rules
    match /tips/{tipId} {
      allow read: if request.auth != null &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.recipientId == request.auth.uid);
      allow write: if request.auth != null &&
        resource.data.senderId == request.auth.uid;
    }
  }
}
```

### Storage Security Rules (if using Storage)

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Push Notifications Setup

### For React Native (Expo)

1. **Install Expo Notifications**:
```bash
npx expo install expo-notifications
```

2. **Configure Firebase Cloud Messaging**:
   - In Firebase Console, go to Project Settings → Cloud Messaging
   - Copy the Server Key (for backend)
   - The app will automatically handle FCM tokens

### For Web (if needed)

1. **Generate VAPID Key**:
   - In Firebase Console, go to Project Settings → Cloud Messaging → Web Push certificates
   - Generate a new key pair
   - Add the public key to your environment variables

## 🔒 Firebase App Check (Optional but Recommended)

1. Go to **App Check** in Firebase Console
2. Enable App Check for your platforms
3. Follow the setup instructions for each platform

## 🧪 Testing Firebase Setup

### Test Authentication:
```bash
# The app will automatically test Firebase connection on startup
# Check console logs for any Firebase errors
```

### Test Firestore:
```bash
# The app will attempt to read/write to Firestore collections
# Check Firebase Console → Firestore for data
```

## 🚀 Deployment

### Environment-Specific Setup:

1. **Development**: Use `.env.development` with test Firebase project
2. **Staging**: Create separate Firebase project for staging
3. **Production**: Use `.env.production` with production Firebase project

### Firebase Hosting (Optional):

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy
firebase deploy
```

## 🔧 Troubleshooting

### Common Issues:

1. **Firebase not connecting**:
   - Check if API keys are correct
   - Verify project ID matches Firebase project
   - Check if Firestore is enabled

2. **Authentication not working**:
   - Ensure Email/Password provider is enabled
   - Check Firebase Console → Authentication → Sign-in method

3. **Push notifications not working**:
   - Verify FCM configuration
   - Check if notifications permissions are granted
   - Ensure FCM server key is correct (for backend)

4. **Firestore permission errors**:
   - Check Firestore security rules
   - Ensure user is authenticated
   - Verify document paths match security rules

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Firebase Integration](https://docs.expo.dev/guides/using-firebase/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## 🎯 Next Steps

1. **Test the setup** by running the app
2. **Configure Paystack** for payments
3. **Set up backend API** endpoints
4. **Implement push notifications**
5. **Configure monitoring** and analytics

---

**Need Help?** Check the Firebase Console for detailed error messages and logs.
