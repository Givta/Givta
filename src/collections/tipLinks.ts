import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface TipLink {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  amount?: number; // Optional suggested amount
  currency: string;
  isActive: boolean;
  shareableUrl: string;
  customSlug?: string;
  backgroundColor?: string;
  textColor?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  analytics: {
    views: number;
    tips: number;
    totalAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export class TipLinksCollection {
  private static collectionName = 'tipLinks';

  /**
   * Create a new tip link
   */
  static async create(tipLink: Omit<TipLink, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...tipLink,
        analytics: {
          views: 0,
          tips: 0,
          totalAmount: 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating tip link:', error);
      throw error;
    }
  }

  /**
   * Get tip link by ID
   */
  static async getById(id: string): Promise<TipLink | null> {
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
          expiresAt: data.expiresAt?.toDate(),
        } as TipLink;
      }
      return null;
    } catch (error) {
      console.error('Error getting tip link:', error);
      throw error;
    }
  }

  /**
   * Get tip link by shareable URL
   */
  static async getByShareableUrl(shareableUrl: string): Promise<TipLink | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('shareableUrl', '==', shareableUrl),
        where('isActive', '==', true),
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
          expiresAt: data.expiresAt?.toDate(),
        } as TipLink;
      }
      return null;
    } catch (error) {
      console.error('Error getting tip link by URL:', error);
      throw error;
    }
  }

  /**
   * Get tip link by custom slug
   */
  static async getByCustomSlug(slug: string): Promise<TipLink | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('customSlug', '==', slug),
        where('isActive', '==', true),
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
          expiresAt: data.expiresAt?.toDate(),
        } as TipLink;
      }
      return null;
    } catch (error) {
      console.error('Error getting tip link by slug:', error);
      throw error;
    }
  }

  /**
   * Get all tip links for a user
   */
  static async getByUserId(userId: string, limitCount: number = 20): Promise<TipLink[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
        } as TipLink;
      });
    } catch (error) {
      console.error('Error getting tip links by user:', error);
      throw error;
    }
  }

  /**
   * Update tip link
   */
  static async update(id: string, updates: Partial<TipLink>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating tip link:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  static async incrementViews(id: string): Promise<void> {
    try {
      const tipLink = await this.getById(id);
      if (tipLink) {
        await this.update(id, {
          analytics: {
            ...tipLink.analytics,
            views: tipLink.analytics.views + 1,
          },
        } as Partial<TipLink>);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  /**
   * Add tip to analytics
   */
  static async addTipAnalytics(id: string, amount: number): Promise<void> {
    try {
      const tipLink = await this.getById(id);
      if (tipLink) {
        await this.update(id, {
          analytics: {
            views: tipLink.analytics.views,
            tips: tipLink.analytics.tips + 1,
            totalAmount: tipLink.analytics.totalAmount + amount,
          },
        } as Partial<TipLink>);
      }
    } catch (error) {
      console.error('Error updating tip analytics:', error);
      throw error;
    }
  }

  /**
   * Delete tip link
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tip link:', error);
      throw error;
    }
  }

  /**
   * Check if custom slug is available
   */
  static async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('customSlug', '==', slug),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return true;
      }

      // If excluding an ID, check if the found document is the one being excluded
      if (excludeId) {
        return querySnapshot.docs[0].id === excludeId;
      }

      return false;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      throw error;
    }
  }

  /**
   * Get tip link statistics for a user
   */
  static async getStatsByUserId(userId: string): Promise<{
    totalLinks: number;
    activeLinks: number;
    totalViews: number;
    totalTips: number;
    totalAmount: number;
  }> {
    try {
      const links = await this.getByUserId(userId, 1000); // Get more for stats

      const stats = {
        totalLinks: links.length,
        activeLinks: links.filter(link => link.isActive).length,
        totalViews: links.reduce((sum, link) => sum + link.analytics.views, 0),
        totalTips: links.reduce((sum, link) => sum + link.analytics.tips, 0),
        totalAmount: links.reduce((sum, link) => sum + link.analytics.totalAmount, 0),
      };

      return stats;
    } catch (error) {
      console.error('Error getting tip link stats:', error);
      throw error;
    }
  }
}
