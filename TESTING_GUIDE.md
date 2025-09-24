# Givta App - End-to-End Testing Guide

## Overview
This guide covers comprehensive testing of the Givta social payment and tipping application.

## Test Environment Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android testing)
- Xcode (for iOS testing, macOS only)
- Firebase project with Firestore
- Paystack account with test keys

### Environment Configuration
1. Copy `.env.example` to `.env.development`
2. Fill in your Firebase and Paystack credentials
3. Update API endpoints if using custom backend

## Testing Categories

### 1. Authentication Testing

#### Test Cases:
- [ ] User registration with valid email/password
- [ ] User login with correct credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Password reset functionality
- [ ] Logout functionality
- [ ] Session persistence across app restarts

#### Steps:
```bash
# Start the app
npx expo start

# Test registration flow
1. Open app → Navigate to signup
2. Enter valid email/password → Submit
3. Verify user creation in Firebase Auth
4. Check automatic login after registration

# Test login flow
1. Logout if logged in
2. Enter credentials → Login
3. Verify navigation to main app
```

### 2. Wallet Functionality Testing

#### Test Cases:
- [ ] Balance display accuracy
- [ ] Transaction history loading
- [ ] Pull-to-refresh functionality
- [ ] Search and filter transactions
- [ ] Transaction detail modal
- [ ] Deposit flow initiation
- [ ] Withdrawal flow initiation

#### Steps:
```bash
# Test wallet features
1. Navigate to Wallet tab
2. Verify balance display
3. Pull down to refresh
4. Tap on transactions to view details
5. Test search functionality
6. Test filter buttons
```

### 3. Payment Integration Testing

#### Test Cases:
- [ ] Paystack WebView loading
- [ ] Payment form display
- [ ] Payment success callback
- [ ] Payment failure handling
- [ ] Transaction verification
- [ ] Balance update after payment

#### Steps:
```bash
# Test payment flow
1. Go to Wallet → Tap "Deposit"
2. Enter amount → Select quick amount
3. Tap "Proceed to Payment"
4. Verify Paystack WebView opens
5. Complete test payment (use Paystack test card)
6. Verify success callback and balance update
```

### 4. Tipping System Testing

#### Test Cases:
- [ ] Recipient validation
- [ ] Amount input and validation
- [ ] Fee calculation display
- [ ] Tip submission
- [ ] Balance deduction
- [ ] Transaction recording

#### Steps:
```bash
# Test tipping flow
1. Navigate to Tip tab
2. Enter recipient ID/username
3. Verify recipient validation
4. Enter tip amount
5. Check fee calculation
6. Submit tip
7. Verify balance update and transaction
```

### 5. Referral System Testing

#### Test Cases:
- [ ] Referral code generation
- [ ] Code sharing functionality
- [ ] Earnings calculation
- [ ] Multi-level bonus tracking
- [ ] Withdrawal from referral earnings

#### Steps:
```bash
# Test referral features
1. Go to Referral tab
2. Check referral code display
3. Test share functionality
4. Use calculator to test earnings
5. Check referral history
6. Test QR code generation
```

### 6. ChatBot Testing

#### Test Cases:
- [ ] Message sending/receiving
- [ ] Quick action buttons
- [ ] Balance inquiry responses
- [ ] Transaction history queries
- [ ] Support contact integration
- [ ] WhatsApp integration

#### Steps:
```bash
# Test chatbot
1. Navigate to ChatBot tab
2. Send various messages
3. Test quick action buttons
4. Ask about balance
5. Inquire about transactions
6. Test support contact
```

### 7. Profile Management Testing

#### Test Cases:
- [ ] Profile display
- [ ] Profile editing
- [ ] Settings navigation
- [ ] App preferences
- [ ] Security settings
- [ ] Logout functionality

#### Steps:
```bash
# Test profile features
1. Go to Profile tab
2. Check profile information display
3. Test navigation to edit profile
4. Test settings screens
5. Test logout
```

### 8. Navigation Testing

#### Test Cases:
- [ ] Bottom tab navigation
- [ ] Stack navigation between screens
- [ ] Deep linking
- [ ] Back navigation
- [ ] Modal presentations

#### Steps:
```bash
# Test navigation
1. Switch between all bottom tabs
2. Navigate to payment screen
3. Test back navigation
4. Test modal presentations
5. Test deep linking (if implemented)
```

## Automated Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Test specific components
npm test -- --testPathPattern=WalletScreen
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

## Performance Testing

### Test Cases:
- [ ] App startup time
- [ ] Screen transition performance
- [ ] List scrolling performance
- [ ] Memory usage
- [ ] Network request performance

### Tools:
- React DevTools for performance profiling
- Expo Performance Monitor
- Firebase Performance Monitoring

## Security Testing

### Test Cases:
- [ ] Secure storage of sensitive data
- [ ] API authentication
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention

## Device Testing

### Supported Devices:
- [ ] iPhone SE (small screen)
- [ ] iPhone 12/13/14 (standard screen)
- [ ] iPad (tablet)
- [ ] Android phones (various sizes)
- [ ] Android tablets

### Test Commands:
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Web browser
npx expo start --web
```

## Build Testing

### Development Build:
```bash
# Development build
npx eas build --platform ios --profile development
npx eas build --platform android --profile development
```

### Production Build:
```bash
# Production build
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

## Bug Reporting Template

When reporting bugs, include:
1. Device/OS information
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/logs
5. Environment (dev/prod)

## Test Data

### Test Users:
- Email: test@givta.com
- Password: TestPass123!

### Test Payment Cards (Paystack):
- Card Number: 4084084084084081
- Expiry: 12/25
- CVV: 408

## Continuous Integration

### GitHub Actions Setup:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Monitoring & Analytics

### Post-Launch Monitoring:
1. Crash reporting (Sentry)
2. Performance monitoring (Firebase)
3. User analytics (Mixpanel)
4. Error tracking
5. User feedback collection

## Final Checklist

- [ ] All test cases pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Accessibility compliant
- [ ] Documentation complete
- [ ] Build successful
- [ ] Deployment ready

## Support Contacts

- Development Team: dev@givta.com
- QA Team: qa@givta.com
- Product Team: product@givta.com
