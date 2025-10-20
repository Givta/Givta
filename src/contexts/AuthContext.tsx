import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiometricService } from '../services/biometric';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { config } from '../config';

// Helper function to generate referral code
const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

interface AuthUser {
  id: string;
  email?: string;
  username: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified: boolean;
  isActive: boolean;
  referralCode: string;
  kycStatus: string;
  preferences: {
    notifications: boolean;
    language: string;
    currency: string;
    theme: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: {
    email: string;
    password: string;
    username: string;
    phoneNumber?: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          console.log('🔥 Firebase user authenticated:', firebaseUser.uid);

          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData: any = {};

          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log('✅ Found existing user document:', userData.referralCode);
          } else {
            // Create user document if it doesn't exist
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
              phoneNumber: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || '',
              emailVerified: firebaseUser.emailVerified,
              isActive: true,
              referralCode: generateReferralCode(), // Use same logic as backend
              kycStatus: 'not_submitted',
              preferences: {
                notifications: true,
                language: 'en',
                currency: 'NGN',
                theme: 'system'
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              referralLevel: 0,
              totalReferrals: 0,
              totalEarnings: 0,
              deviceTokens: [],
              userType: 'user',
              phoneVerified: !!firebaseUser.phoneNumber
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            console.log('📝 Created new user document in Firestore with referral code:', userData.referralCode);
          }

          // Create AuthUser object
          const authUser: AuthUser = {
            id: firebaseUser.uid,
            email: userData.email,
            username: userData.username,
            phoneNumber: userData.phoneNumber,
            photoURL: userData.photoURL,
            emailVerified: userData.emailVerified,
            isActive: userData.isActive,
            referralCode: userData.referralCode,
            kycStatus: userData.kycStatus,
            preferences: userData.preferences,
            tokens: {
              accessToken: await firebaseUser.getIdToken(),
              refreshToken: firebaseUser.refreshToken || ''
            }
          };

          setUser(authUser);

          // Store in AsyncStorage for persistence
          await AsyncStorage.setItem('user', JSON.stringify(authUser));
          await AsyncStorage.setItem('authToken', await firebaseUser.getIdToken()); // For API service
          await AsyncStorage.setItem('firebaseUser', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          }));

      console.log('✅ User authenticated and data loaded:', authUser.username, 'accessToken available:', !!authUser.tokens?.accessToken);
        } else {
          console.log('🔥 No Firebase user authenticated');
          setUser(null);
          await AsyncStorage.multiRemove(['user', 'firebaseUser']);
        }
      } catch (error) {
        console.error('❌ Error in auth state listener:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Starting Firebase login process...');

      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔥 Signing in with Firebase Auth...');

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      console.log('✅ Firebase login successful for user:', userCredential.user.email);

      // The auth state listener will handle updating the user state
      // No need to manually set user here as onAuthStateChanged will trigger

    } catch (error: any) {
      console.error('❌ Firebase login error:', error);

      let errorMessage = 'Login failed';

      // Handle Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    username: string;
    phoneNumber?: string;
    referralCode?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Starting Firebase signup process...');

      // Validate required fields
      if (!userData.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!userData.username?.trim()) {
        throw new Error('Username is required');
      }
      if (!userData.password?.trim()) {
        throw new Error('Password is required');
      }
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!userData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔥 Creating Firebase Auth account...');

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email.trim(), userData.password);

      console.log('✅ Firebase Auth account created');

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: userData.username.trim()
      });

      // Handle referral code if provided
      let referrerId: string | null = null;
      let referralBonus = 0;

      if (userData.referralCode?.trim()) {
        console.log('🔍 Processing referral code:', userData.referralCode);

        try {
          // Validate referral code with backend
          const validateResponse = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/referrals/validate/${userData.referralCode.trim()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const validateData = await validateResponse.json();

          if (validateData.success && validateData.valid && validateData.user) {
            referrerId = validateData.user.id;
            console.log('✅ Valid referral code, referrer:', referrerId);

            // Process referral with backend
            const processResponse = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/referrals/process-signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                referrerId: referrerId,
                referredId: userCredential.user.uid,
                referralCode: userData.referralCode.trim().toUpperCase(),
                referrerName: validateData.user.username,
                referredName: userData.username,
                referrerEmail: validateData.user.email,
                referredEmail: userData.email
              }),
            });

            const processData = await processResponse.json();

            if (processData.success) {
              referralBonus = 100;
              console.log('🎉 Referral processed successfully, bonus awarded');
            } else {
              console.error('❌ Referral processing failed:', processData.error);
            }
          } else {
            console.log('❌ Invalid referral code:', userData.referralCode);
          }
        } catch (referralError) {
          console.error('Error processing referral:', referralError);
          // Continue with signup even if referral processing fails
        }
      }

      // Generate referral code for new user (same logic as backend)
      const newReferralCode = generateReferralCode();
      console.log('🎫 Generated referral code for new user:', newReferralCode);

      // Create user document in Firestore
      const userDocData = {
        id: userCredential.user.uid,
        email: userData.email.trim(),
        username: userData.username.trim(),
        phoneNumber: userData.phoneNumber?.trim() || '',
        photoURL: '',
        emailVerified: userCredential.user.emailVerified,
        isActive: true,
        referralCode: newReferralCode, // Use generated code (same as backend)
        kycStatus: 'not_submitted',
        preferences: {
          notifications: true,
          language: 'en',
          currency: 'NGN',
          theme: 'system'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        referralLevel: 0,
        totalReferrals: 0,
        totalEarnings: referralBonus, // Start with referral bonus if any
        deviceTokens: [],
        userType: 'user',
        phoneVerified: false,
        referredBy: referrerId, // Track who referred this user
        referralBonusEarned: referralBonus // Track how much bonus this user earned from being referred
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDocData);

      console.log('📝 User document created in Firestore');
      if (referrerId) {
        console.log('🎁 Referral bonus processed for referrer:', referrerId);
      }
      console.log('✅ Registration successful for user:', userData.username);

      // The auth state listener will handle updating the user state
      // No need to manually set user here as onAuthStateChanged will trigger

    } catch (error: any) {
      console.error('❌ Firebase signup error:', error);

      let errorMessage = 'Registration failed';

      // Handle Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚪 Starting Firebase logout process...');

      // Sign out from Firebase Auth
      await signOut(auth);

      // Clear session-specific storage (but keep biometric if enabled)
      await AsyncStorage.multiRemove(['user', 'authToken', 'firebaseUser']);

      console.log('✅ Firebase logout successful');

      // The auth state listener will handle clearing the user state
      // No need to manually set user to null here

    } catch (error: any) {
      console.error('❌ Firebase logout error:', error);
      setError('Failed to logout properly');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
