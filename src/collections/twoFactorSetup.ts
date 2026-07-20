import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface TwoFactorSetup {
  id?: string;
  userId: string;
  method: 'sms' | 'email' | 'authenticator';
  secret?: string; // For authenticator apps
  backupCodes: string[]; // Encrypted backup codes
  phoneNumber?: string; // For SMS method
  email?: string; // For email method
  isEnabled: boolean;
  isVerified: boolean;
  verificationCode?: string; // Temporary for verification
  verificationExpiresAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export class TwoFactorSetupCollection {
  private static collectionName = 'twoFactorSetup';

  /**
   * Create a new 2FA setup
   */
  static async create(setup: Omit<TwoFactorSetup, 'id' | 'createdAt' | 'updatedAt' | 'failedAttempts'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...setup,
        failedAttempts: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Get 2FA setup by ID
   */
  static async getById(id: string): Promise<TwoFactorSetup | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          verificationExpiresAt: data.verificationExpiresAt?.toDate(),
          lockedUntil: data.lockedUntil?.toDate(),
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as TwoFactorSetup;
      }
      return null;
    } catch (error) {
      console.error('Error getting 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Get 2FA setup by user ID
   */
  static async getByUserId(userId: string): Promise<TwoFactorSetup | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          verificationExpiresAt: data.verificationExpiresAt?.toDate(),
          lockedUntil: data.lockedUntil?.toDate(),
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as TwoFactorSetup;
      }
      return null;
    } catch (error) {
      console.error('Error getting 2FA setup by user:', error);
      throw error;
    }
  }

  /**
   * Get all 2FA setups for a user (in case they have multiple methods)
   */
  static async getAllByUserId(userId: string): Promise<TwoFactorSetup[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          verificationExpiresAt: data.verificationExpiresAt?.toDate(),
          lockedUntil: data.lockedUntil?.toDate(),
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as TwoFactorSetup;
      });
    } catch (error) {
      console.error('Error getting all 2FA setups by user:', error);
      throw error;
    }
  }

  /**
   * Update 2FA setup
   */
  static async update(id: string, updates: Partial<TwoFactorSetup>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Set verification code for 2FA setup
   */
  static async setVerificationCode(id: string, code: string, expiresInMinutes: number = 10): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      await this.update(id, {
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        failedAttempts: 0, // Reset failed attempts
      });
    } catch (error) {
      console.error('Error setting verification code:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code
   */
  static async verifyCode(id: string, code: string): Promise<boolean> {
    try {
      const setup = await this.getById(id);
      if (!setup) {
        return false;
      }

      // Check if code is expired
      if (setup.verificationExpiresAt && setup.verificationExpiresAt < new Date()) {
        return false;
      }

      // Check if account is locked
      if (setup.lockedUntil && setup.lockedUntil > new Date()) {
        return false;
      }

      // Check code
      if (setup.verificationCode === code) {
        // Clear verification code and update last used
        await this.update(id, {
          verificationCode: undefined,
          verificationExpiresAt: undefined,
          failedAttempts: 0,
          lastUsedAt: new Date(),
          isVerified: true,
        });
        return true;
      } else {
        // Increment failed attempts
        const newFailedAttempts = (setup.failedAttempts || 0) + 1;
        const updates: Partial<TwoFactorSetup> = {
          failedAttempts: newFailedAttempts,
        };

        // Lock account if too many failed attempts
        if (newFailedAttempts >= 5) {
          const lockedUntil = new Date();
          lockedUntil.setHours(lockedUntil.getHours() + 1); // Lock for 1 hour
          updates.lockedUntil = lockedUntil;
        }

        await this.update(id, updates);
        return false;
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA
   */
  static async enable(id: string): Promise<void> {
    try {
      await this.update(id, {
        isEnabled: true,
        verificationCode: undefined,
        verificationExpiresAt: undefined,
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  static async disable(id: string): Promise<void> {
    try {
      await this.update(id, {
        isEnabled: false,
        isVerified: false,
        verificationCode: undefined,
        verificationExpiresAt: undefined,
        failedAttempts: 0,
        lockedUntil: undefined,
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Delete 2FA setup
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  static async hasEnabled2FA(userId: string): Promise<boolean> {
    try {
      const setups = await this.getAllByUserId(userId);
      return setups.some(setup => setup.isEnabled && setup.isVerified);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Get backup codes for a user
   */
  static async getBackupCodes(userId: string): Promise<string[]> {
    try {
      const setup = await this.getByUserId(userId);
      return setup?.backupCodes || [];
    } catch (error) {
      console.error('Error getting backup codes:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(id: string): Promise<string[]> {
    try {
      // Generate 10 backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      await this.update(id, {
        backupCodes,
        updatedAt: new Date(),
      });

      return backupCodes;
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  }
}
