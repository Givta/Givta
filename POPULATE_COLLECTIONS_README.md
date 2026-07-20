# Populate Firestore Collections

This guide explains how to populate Firestore collections with initial data for both development and production environments.

## Overview

The `populate-collections.js` script populates all Firestore collections with sample data tailored for each environment:
- **Development**: Includes test balances and sample transactions
- **Production**: Clean slate with minimal initial data

## Prerequisites

1. **Firebase Admin SDK**: Install required dependencies
   ```bash
   npm install firebase-admin dotenv
   ```

2. **Service Account Credentials**: Set up Firebase service account credentials for each environment

## Setup Firebase Service Account Credentials

### Step 1: Create Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (givta-dev for development, givta-94cb8 for production)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file

### Step 2: Configure Environment Variables

Create a `.env` file in the `givta/` directory with your service account credentials:

```env
# Firebase Service Account Credentials
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your_client_email_here
FIREBASE_CLIENT_ID=your_client_id_here
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url_here
```

**Important**: Replace the placeholder values with actual values from your downloaded JSON file.

### Step 3: Alternative - Use Separate .env Files

You can create separate `.env` files for each environment:
- `.env.development` for development environment
- `.env.production` for production environment

## Usage

### Populate Development Environment

```bash
# Using development project (givta-dev)
node populate-collections.js --env=development
```

### Populate Production Environment

```bash
# Using production project (givta-94cb8)
node populate-collections.js --env=production
```

### Default Environment

If no environment is specified, it defaults to development:

```bash
node populate-collections.js
```

## What Gets Populated

### Development Environment Data
- **Users**: 3 test users with sample profiles
- **Wallets**: 2 wallets with test balances (₦10,000 and ₦5,000)
- **Transactions**: Sample deposit transactions
- **Referrals**: Sample referral relationships
- **Notifications**: Welcome and system notifications
- **Tips**: Sample tip transactions

### Production Environment Data
- **Users**: 3 users with clean profiles
- **Wallets**: 2 wallets with zero balances
- **Transactions**: Minimal welcome transactions
- **Referrals**: Basic referral structure
- **Notifications**: Essential notifications only
- **Tips**: Minimal tip data

## Data Structure

All collections include:
- `createdAt` and `updatedAt` timestamps
- Environment-specific prefixes (DEV_ or PROD_)
- Realistic sample data matching your app's requirements

## Troubleshooting

### "Failed to parse private key" Error
- Ensure your `FIREBASE_PRIVATE_KEY` is properly formatted
- Make sure it includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` headers
- Check that the private key is on multiple lines with `\n` escape sequences

### "Firebase project not found" Error
- Verify the project ID in the script matches your Firebase project
- Check that you have access to the specified Firebase project
- Ensure the service account has appropriate permissions

### Permission Denied
- Make sure your service account has Firestore Admin permissions
- Check that the service account is associated with the correct Firebase project

## Security Notes

- Never commit `.env` files with real credentials to version control
- Use different service accounts for development and production
- Regularly rotate service account keys
- Store credentials securely and limit access

## Next Steps

After successful population:

1. **Verify Data**: Check Firebase Console to confirm data was created
2. **Test App**: Use the populated data to test your app functionality
3. **Customize**: Modify the sample data in `populate-collections.js` as needed
4. **Clean Up**: Remove test data from production when ready

## Support

If you encounter issues:
1. Check the error messages for specific guidance
2. Verify all prerequisites are met
3. Ensure Firebase projects exist and are accessible
4. Confirm service account credentials are valid

---

**Note**: This script is designed for initial data population. For ongoing data management, consider using Firebase's import/export tools or custom admin scripts.
