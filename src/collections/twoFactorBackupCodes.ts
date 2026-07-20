import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface TwoFactorBackupCode {
  id?: string;
  userId: string;
  codeHash: string; // Hashed backup code
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export class TwoFactorBackupCodesCollection {
  private static collectionName = 'twoFactorBackupCodes';

  /**
   * Create a new backup code
   */
  static async create(backupCode: Omit<TwoFactorBackupCode, 'id' | 'createdAt' | 'isUsed'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...backupCode,
        isUsed: false,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating backup code:', error);
      throw error;
    }
  }

  /**
   * Create multiple backup codes for a user
   */
  static async createMultiple(userId: string, codeHashes: string[], expiresAt?: Date): Promise<string[]> {
    try {
      const ids: string[] = [];

      for (const codeHash of codeHashes) {
        const id = await this.create({
          userId,
          codeHash,
          expiresAt,
        });
        ids.push(id);
      }

      return ids;
    } catch (error) {
      console.error('Error creating multiple backup codes:', error);
      throw error;
    }
  }

  /**
   * Get backup code by ID
   */
  static async getById(id: string): Promise<TwoFactorBackupCode | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          usedAt: data.usedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as TwoFactorBackupCode;
      }
      return null;
    } catch (error) {
      console.error('Error getting backup code:', error);
      throw error;
    }
  }

  /**
   * Get all unused backup codes for a user
   */
  static async getUnusedByUserId(userId: string): Promise<TwoFactorBackupCode[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isUsed', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          usedAt: data.usedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as TwoFactorBackupCode;
      });
    } catch (error) {
      console.error('Error getting unused backup codes:', error);
      throw error;
    }
  }

  /**
   * Get all backup codes for a user
   */
  static async getAllByUserId(userId: string): Promise<TwoFactorBackupCode[]> {
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
          usedAt: data.usedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as TwoFactorBackupCode;
      });
    } catch (error) {
      console.error('Error getting all backup codes:', error);
      throw error;
    }
  }

  /**
   * Find backup code by hash (for verification)
   */
  static async getByHash(codeHash: string): Promise<TwoFactorBackupCode | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('codeHash', '==', codeHash),
        where('isUsed', '==', false),
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
          usedAt: data.usedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as TwoFactorBackupCode;
      }
      return null;
    } catch (error) {
      console.error('Error getting backup code by hash:', error);
      throw error;
    }
  }

  /**
   * Mark backup code as used
   */
  static async markAsUsed(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        isUsed: true,
        usedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking backup code as used:', error);
      throw error;
    }
  }

  /**
   * Delete backup code
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting backup code:', error);
      throw error;
    }
  }

  /**
   * Delete all backup codes for a user
   */
  static async deleteAllByUserId(userId: string): Promise<void> {
    try {
      const codes = await this.getAllByUserId(userId);
      const deletePromises = codes.map(code => this.delete(code.id!));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting all backup codes for user:', error);
      throw error;
    }
  }

  /**
   * Check if user has unused backup codes
   */
  static async hasUnusedCodes(userId: string): Promise<boolean> {
    try {
      const codes = await this.getUnusedByUserId(userId);
      return codes.length > 0;
    } catch (error) {
      console.error('Error checking for unused backup codes:', error);
      return false;
    }
  }

  /**
   * Get backup codes count for a user
   */
  static async getCountByUserId(userId: string): Promise<{
    total: number;
    used: number;
    unused: number;
  }> {
    try {
      const allCodes = await this.getAllByUserId(userId);
      const used = allCodes.filter(code => code.isUsed).length;
      const unused = allCodes.filter(code => !code.isUsed).length;

      return {
        total: allCodes.length,
        used,
        unused,
      };
    } catch (error) {
      console.error('Error getting backup codes count:', error);
      throw error;
    }
  }

  /**
   * Verify and use backup code
   */
  static async verifyAndUseCode(userId: string, codeHash: string): Promise<boolean> {
    try {
      const backupCode = await this.getByHash(codeHash);

      if (!backupCode || backupCode.userId !== userId) {
        return false;
      }

      // Check if code is expired
      if (backupCode.expiresAt && backupCode.expiresAt < new Date()) {
        return false;
      }

      // Mark as used
      await this.markAsUsed(backupCode.id!);
      return true;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      throw error;
    }
  }
}
