# Givta App - Deployment Guide

## Overview
This guide covers the complete deployment process for the Givta social payment and tipping application to both iOS App Store and Google Play Store.

## Prerequisites

### Required Accounts & Tools
- [ ] Apple Developer Program ($99/year)
- [ ] Google Play Console ($25 one-time)
- [ ] EAS (Expo Application Services) account
- [ ] Firebase project
- [ ] Paystack merchant account
- [ ] Domain name (givta.com.ng)

### Development Environment
- [ ] Node.js 18+
- [ ] Expo CLI
- [ ] Xcode 13+ (for iOS)
- [ ] Android Studio (for Android)
- [ ] Git repository

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance optimized
- [ ] Bundle size optimized

### 2. Security
- [ ] API keys properly configured
- [ ] Environment variables set
- [ ] Sensitive data not in version control
- [ ] SSL certificates configured
- [ ] Security audit completed

### 3. Assets & Branding
- [ ] App icons created (all sizes)
- [ ] Splash screens designed
- [ ] Screenshots prepared (5-8 per platform)
- [ ] App store descriptions written
- [ ] Privacy policy and terms ready

### 4. Backend & Services
- [ ] Firebase project configured
- [ ] Firestore security rules deployed
- [ ] Paystack integration tested
- [ ] Backend API deployed
- [ ] Database migrations completed

## Environment Configuration

### Production Environment Setup
```bash
# Copy production environment file
cp .env.example .env.production

# Fill in production values
EXPO_PUBLIC_FIREBASE_API_KEY=your_production_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=givta-prod
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
EXPO_PUBLIC_API_BASE_URL=https://api.givta.app/api
```

### EAS Build Configuration
```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  }
}
```

## iOS Deployment

### 1. Apple Developer Setup
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Configure iOS bundle identifier
eas build:configure
```

### 2. App Store Connect Setup
1. Create app in App Store Connect
2. Generate bundle ID: `com.givta.app`
3. Configure app information:
   - Name: Givta
   - Subtitle: Social Payment & Tipping
   - Description: [Write compelling description]
   - Keywords: payment, tipping, social, money
   - Support URL: https://givta.com.ng/support
   - Marketing URL: https://givta.com.ng

### 3. Build Production iOS App
```bash
# Build for production
eas build --platform ios --profile production

# Monitor build status
eas build:list

# Download build when complete
eas build:run --latest
```

### 4. TestFlight Distribution
```bash
# Submit to TestFlight
eas submit --platform ios --latest

# Or submit manually via Transporter app
```

### 5. App Store Submission
1. Upload build via App Store Connect
2. Fill metadata:
   - Screenshots (6.5", 5.5", iPad)
   - App icons
   - Description and keywords
   - Support information
   - Privacy policy URL
3. Configure pricing and availability
4. Submit for review

## Android Deployment

### 1. Google Play Console Setup
1. Create app in Google Play Console
2. Configure app details:
   - App name: Givta
   - Short description: Social payment & tipping app
   - Full description: [Detailed description]
   - Category: Finance
   - Content rating: Everyone

### 2. Generate Signing Key
```bash
# Generate upload key (keep secure!)
keytool -genkeypair -v -storetype PKCS12 -keystore givta-upload-key.keystore -alias givta-upload-key -keyalg RSA -keysize 2048 -validity 10000

# Configure EAS for Android
eas build:configure
```

### 3. Build Production Android App
```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production

# Monitor build
eas build:list

# Download when complete
eas build:run --latest
```

### 4. Internal Testing Track
```bash
# Submit to internal testing
eas submit --platform android --latest
```

### 5. Google Play Store Submission
1. Upload AAB file to Google Play Console
2. Configure store listing:
   - Screenshots (phone, tablet, large screen)
   - Feature graphic
   - App icons
   - Description and short description
3. Set pricing and distribution
4. Submit for review

## Web Deployment (PWA)

### 1. Build Web App
```bash
# Build for web
npx expo export --platform web

# Or use EAS
eas build --platform web --profile production
```

### 2. Deploy to Hosting
```bash
# Deploy to Vercel
npm i -g vercel
vercel --prod

# Or deploy to Netlify
npm i -g netlify-cli
netlify deploy --prod --dir dist
```

### 3. Configure PWA
```json
// web/manifest.json
{
  "name": "Givta",
  "short_name": "Givta",
  "description": "Social payment & tipping app",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4B0082",
  "background_color": "#ffffff"
}
```

## Backend Deployment

### 1. Server Setup
```bash
# Deploy to production server
# Options: AWS, DigitalOcean, Heroku, Vercel, etc.

# Example with Railway
railway login
railway link
railway up

# Or with Render
render deploy
```

### 2. Database Setup
```bash
# Configure production database
# Options: PlanetScale, Supabase, MongoDB Atlas

# Run migrations
npm run db:migrate
```

### 3. Environment Variables
```bash
# Set production environment variables
PAYSTACK_SECRET_KEY=sk_live_xxx
FIREBASE_SERVICE_ACCOUNT_KEY=xxx
DATABASE_URL=postgresql://xxx
JWT_SECRET=your_jwt_secret
```

## Firebase Configuration

### 1. Production Firebase Project
```bash
# Switch to production project
firebase use givta-prod

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firebase functions (if any)
firebase deploy --only functions
```

### 2. Configure Authentication
1. Enable Email/Password authentication
2. Configure authorized domains
3. Set up password reset templates

### 3. Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production security rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /wallets/{walletId} {
      allow read, write: if request.auth != null && request.auth.uid == walletId;
    }
    // Add other rules...
  }
}
```

## Paystack Configuration

### 1. Live Account Setup
1. Upgrade to live account
2. Configure webhook URLs
3. Set up settlement account
4. Configure API keys

### 2. Webhook Configuration
```javascript
// Backend webhook handler
app.post('/webhooks/paystack', (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send('Invalid signature');
  }

  // Process webhook
  const event = req.body;
  // Handle payment success, failure, etc.
});
```

## Monitoring & Analytics

### 1. Error Tracking
```bash
# Setup Sentry
npm install @sentry/react-native
# Configure with production DSN
```

### 2. Performance Monitoring
```bash
# Firebase Performance
# Mixpanel analytics
# App store analytics
```

### 3. Crash Reporting
```bash
# Configure crash reporting
# Set up alerts for critical issues
```

## Post-Launch Tasks

### 1. App Store Optimization (ASO)
- [ ] Optimize app title and description
- [ ] Use relevant keywords
- [ ] Create compelling screenshots
- [ ] Encourage user reviews and ratings

### 2. User Acquisition
- [ ] Set up referral tracking
- [ ] Configure marketing campaigns
- [ ] Create landing page
- [ ] Set up social media presence

### 3. Support Setup
- [ ] Configure customer support channels
- [ ] Set up help documentation
- [ ] Create FAQ section
- [ ] Establish response time SLAs

### 4. Compliance & Legal
- [ ] GDPR compliance
- [ ] Financial regulations compliance
- [ ] Terms of service and privacy policy
- [ ] Data processing agreements

## Rollback Plan

### Emergency Rollback
```bash
# iOS rollback
# Submit previous version to App Store

# Android rollback
# Rollback to previous version in Play Console

# Backend rollback
# Deploy previous backend version
# Restore database backup
```

## Maintenance Schedule

### Regular Tasks
- [ ] Weekly: Monitor crash reports and fix critical bugs
- [ ] Monthly: Update dependencies and security patches
- [ ] Quarterly: Performance optimization and feature updates
- [ ] Annually: Major version updates and platform migrations

## Success Metrics

### Key Performance Indicators
- App downloads and installations
- User retention and engagement
- Transaction volume and success rate
- Customer satisfaction scores
- App store ratings and reviews
- Revenue and profitability metrics

## Support Contacts

- Technical Support: tech@givta.app
- Customer Support: support@givta.app, givtamanager@gmail.com
- DevOps: devops@givta.app
- Product: product@givta.app

---

## Quick Deployment Commands

```bash
# Full deployment pipeline
npm run build:all
eas build --platform all --profile production
eas submit --platform all --latest
firebase deploy
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Expo SDK compatibility
2. **App Store Rejections**: Review submission guidelines
3. **Payment Issues**: Verify Paystack configuration
4. **Firebase Errors**: Check security rules and permissions

### Support Resources
- Expo Documentation: https://docs.expo.dev/
- EAS Documentation: https://docs.expo.dev/eas/
- Apple Developer: https://developer.apple.com/
- Google Play: https://play.google.com/console/

---

**Ready for launch! 🚀**
