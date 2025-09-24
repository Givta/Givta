import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

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
  signIn: (identifier: string, password: string) => Promise<void>; // identifier can be email or phone
  signUp: (userData: {
    email?: string;
    phoneNumber?: string;
    password: string;
    username: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    // Check for stored authentication on app start
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedTokens = await AsyncStorage.getItem('tokens');

      if (storedUser && storedTokens) {
        const userData = JSON.parse(storedUser);
        const tokens = JSON.parse(storedTokens);

        // Verify token is still valid
        const isValid = await verifyToken(tokens.accessToken);
        if (isValid) {
          setUser({ ...userData, tokens });
        } else {
          // Try to refresh token
          const newTokens = await refreshToken(tokens.refreshToken);
          if (newTokens) {
            const updatedUser = { ...userData, tokens: newTokens };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            await AsyncStorage.setItem('tokens', JSON.stringify(newTokens));
          } else {
            // Token refresh failed, clear storage
            await clearStoredAuth();
          }
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      await clearStoredAuth();
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${config.api.baseURL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const refreshToken = async (refreshToken: string): Promise<any> => {
    try {
      const response = await fetch(`${config.api.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.tokens;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const clearStoredAuth = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokens');
    setUser(null);
  };

  const _saveAuthSession = async (user: AuthUser, tokens: { accessToken: string; refreshToken: string; }) => {
    const userWithTokens = { ...user, tokens };
    setUser(userWithTokens);

    // Store in AsyncStorage
    // Storing the user object without tokens to avoid duplicating token data
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));

    // Note: Device token registration is handled in App.tsx for Expo Go compatibility
  };



  const signIn = async (identifier: string, password: string) => {
    try {
      // Determine if the identifier is an email or a phone number
      const isEmail = identifier.includes('@');
      const payload = {
        ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
        password,
      };

      const response = await fetch(`${config.api.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Store user data and tokens
      await _saveAuthSession(data.data.user, data.data.tokens);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const signUp = async (userData: {
    email?: string;
    phoneNumber?: string;
    password: string;
    username: string;
    referralCode?: string;
  }) => {
    try {
      const response = await fetch(`${config.api.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      // The registration endpoint already returns the user and tokens.
      // No need for a separate login call.

      // Store user data and tokens
      await _saveAuthSession(data.data.user, data.data.tokens);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const logout = async () => {
    try {
      // Call backend logout if needed
      if (user?.tokens?.accessToken) {
        try {
          await fetch(`${config.api.baseURL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.tokens.accessToken}`,
            },
          });
        } catch (error) {
          console.warn('Backend logout failed:', error);
        }
      }

      // Clear local storage
      await clearStoredAuth();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
