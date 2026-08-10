# Givta — Creator Tipping App

> A React Native mobile app that lets Nigerian fans tip their favourite content creators instantly — via a simple personalised payment link powered by Paystack.

---

## Why I Built This

Content creators in Nigeria work hard — YouTubers, Twitter/X personalities, Substack writers, musicians — but they have no easy way for their Nigerian audience to support them financially. International platforms don't support Naira. Bank transfers feel awkward and transactional. Paystack-powered links work, but setting one up requires technical knowledge most creators don't have.

Givta gives every creator a personalised tipping link in under two minutes. Fans open the link, enter an amount, and pay. The creator sees the money in their Givta wallet and withdraws to their bank account — no code, no setup, no foreign payment headaches.

---

## Screenshots

> *## Screenshots

<p align="center">
  <img src="screenshots/home.png" width="200" alt="Home & Wallet"/>
  <img src="screenshots/withdraw.png" width="200" alt="Withdrawal Screen"/>
  <img src="screenshots/sign-up.png" width="200" alt="Tipping Link Page"/>
  <img src="screenshots/login.png" width="200" alt="Transaction History"/>
</p>*

---

## Features

- 💰 **Digital Wallet** — Real-time balance display with full transaction history
- 🎯 **Social Tipping** — Send tips to any creator via their Givta link
- 🔗 **Referral System** — Earn rewards for inviting other creators and fans
- 🤖 **AI Chatbot** — In-app conversational assistant for support and guidance
- 🔥 **Real-time Updates** — Live wallet notifications via Firebase Cloud Messaging
- 🔐 **Secure Auth** — Firebase Authentication with persistent login state
- 📱 **Cross-Platform** — iOS and Android from a single TypeScript codebase
- 💳 **Paystack Payments** — Naira-native deposits and bank withdrawals

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (Managed Workflow) |
| Language | TypeScript |
| Navigation | React Navigation (Stack + Tab) |
| State | React Context API |
| Auth | Firebase Authentication |
| Database | Firebase Firestore (real-time) |
| Payments | Paystack |
| Notifications | Firebase Cloud Messaging |
| Build | EAS Build + EAS Submit |
| Deployment | Google Play Store |

---

## Project Structure

```
givta/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   │   ├── Auth/            # Login, Register
│   │   ├── Wallet/          # Balance, transactions, deposit, withdraw
│   │   ├── Tip/             # Tipping flow and creator link page
│   │   ├── Referral/        # Referral dashboard
│   │   └── Profile/         # User profile and settings
│   ├── contexts/            # AuthContext, WalletContext
│   ├── services/            # API service layer
│   ├── config/              # Firebase and environment config
│   ├── navigation/          # Stack + Tab navigator setup
│   └── firebase.ts          # Firebase initialisation
├── assets/                  # Icons, splash, images
├── app.json                 # Expo config
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for development)
- Android Studio or Xcode (for emulator)

### 1. Clone and Install

```bash
git clone https://github.com/unusualdan/givta.git
cd givta
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env`:

```env
# API
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Paystack
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your-key

# App
EXPO_PUBLIC_APP_NAME=Givta
EXPO_PUBLIC_ENVIRONMENT=development
```

### 3. Run

```bash
# Start dev server
npx expo start

# Scan QR code with Expo Go on your phone
# or press 'a' for Android emulator / 'i' for iOS simulator
```

---

## Production Build (EAS)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to Play Store
eas submit --platform android
```

---

## Architecture Notes

### State Management
All global state lives in React Context:
- `AuthContext` — authentication state, user profile, login/logout
- `WalletContext` — wallet balance, transactions, deposit/withdraw actions

### API Layer
All backend communication is abstracted in `src/services/`. To swap the backend URL or add new endpoints, only the service files need to change — screens stay untouched.

### Authentication Flow
1. Firebase Auth handles login, registration, and token management
2. On app launch, `AuthContext` checks for a persisted session
3. Successful auth routes to the main tab navigator
4. Token refresh is handled automatically by Firebase SDK

---

## Related

- [Givta Backend](https://github.com/unusualdan/givta-backend) — Node.js + Express + Paystack API
- [Givta PWA](https://github.com/unusualdan/givta-pwa) — Next.js web version (in progress)

---

## License

ISC © Opeyemi Daniel Atoyebi
