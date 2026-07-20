# Givta Mobile App

A React Native mobile application for social tipping and wallet management, built with Expo.

## Features

- 🤖 **AI Chatbot** - Integrated conversational assistant
- 💰 **Digital Wallet** - Secure balance management
- 🎯 **Social Tipping** - Send tips to other users
- 🔗 **Referral System** - Earn rewards for inviting friends
- 📱 **Cross-Platform** - iOS and Android support
- 🔥 **Real-time Updates** - Live notifications and updates
- 🔐 **Secure Authentication** - Firebase Auth integration

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Backend**: REST API with Firebase
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Payments**: Paystack integration
- **Notifications**: Firebase Cloud Messaging

## Project Structure

```
givta/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens/pages
│   ├── contexts/           # React contexts for state management
│   ├── services/           # API services and utilities
│   ├── config/             # Configuration files
│   ├── navigation/         # Navigation setup
│   └── firebase.ts         # Firebase configuration
├── assets/                 # Images, icons, and media files
├── .env                    # Environment variables
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Studio (Windows/Linux)

### 1. Install Dependencies

```bash
cd givta
npm install
```

### 2. Environment Configuration

Copy the environment file and update the values:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Paystack Configuration
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-key

# App Configuration
EXPO_PUBLIC_APP_NAME=Givta
EXPO_PUBLIC_ENVIRONMENT=development
```

### 3. Firebase Setup

#### For Development (Expo Go):
The app uses web Firebase SDK for Expo Go compatibility.

#### For Production:
1. Configure native Firebase modules
2. Update `app.json` with Firebase plugins
3. Rebuild the app

### 4. Run the App

#### Development (Expo Go):
```bash
npx expo start --tunnel
```

#### Development Build:
```bash
npx expo run:ios  # iOS
npx expo run:android  # Android
```

#### Production Build:
```bash
eas build --platform ios
eas build --platform android
```

## Development Workflow

### Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
npm run build      # Build for production
```

### Code Quality

```bash
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking
```

### Testing

```bash
npm run test       # Run Jest tests
npm run test:watch # Run tests in watch mode
```

## App Architecture

### State Management

The app uses React Context API for state management:

- **AuthContext**: User authentication state
- **WalletContext**: Wallet balance and transactions

### Navigation

Built with React Navigation:

- **Stack Navigator**: Screen transitions
- **Tab Navigator**: Bottom tab navigation
- **Modal Screens**: Overlays and forms

### API Integration

RESTful API communication with:

- Authentication endpoints
- Wallet management
- Transaction processing
- User profile management

## Key Features Implementation

### Authentication Flow

1. **Login/Register**: Firebase Auth integration
2. **Token Management**: JWT tokens with refresh logic
3. **Auto-login**: Persistent authentication state

### Wallet System

1. **Balance Display**: Real-time balance updates
2. **Transaction History**: Complete transaction log
3. **Deposit/Withdraw**: Paystack integration

### Social Features

1. **Tipping**: Send tips to other users
2. **Referrals**: Invite system with rewards
3. **Chatbot**: AI-powered assistant

## Deployment

### Expo Application Services (EAS)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for production
eas build --platform ios
eas build --platform android
```

### Environment-Specific Builds

- **Development**: Debug builds with hot reload
- **Staging**: Test builds for QA
- **Production**: Optimized release builds

## Troubleshooting

### Common Issues

#### Expo Go Issues
- Clear Expo cache: `npx expo start --clear`
- Reset Metro bundler: `npx expo r -c`

#### Firebase Issues
- Check Firebase configuration in `.env`
- Verify Firebase project settings
- Ensure correct API keys

#### Network Issues
- Check backend URL in `.env`
- Verify CORS configuration
- Test API endpoints with tools like Postman

#### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo install --fix`
- Check Expo SDK compatibility

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('Debug info:', data);
```

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

ISC License

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team
