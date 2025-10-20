import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface ExternalTip {
  id?: string;
  tipLinkId: string;
  recipientId: string;
  senderName?: string;
  senderEmail?: string;
  amount: number;
  currency: string;
  message?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentReference?: string;
  paystackReference?: string;
  createdAt: Date;
  completedAt?: Date;
  platformFee: number;
  recipientAmount: number;
}

export class ExternalTipsCollection {
  private static collectionName = 'externalTips';

  /**
   * Create a new external tip
   */
  static async create(tip: Omit<ExternalTip, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...tip,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating external tip:', error);
      throw error;
    }
  }

  /**
   * Get external tip by ID
   */
  static async getById(id: string): Promise<ExternalTip | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        } as ExternalTip;
      }
      return null;
    } catch (error) {
      console.error('Error getting external tip:', error);
      throw error;
    }
  }

  /**
   * Get external tips by tip link ID
   */
  static async getByTipLinkId(tipLinkId: string): Promise<ExternalTip[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('tipLinkId', '==', tipLinkId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as ExternalTip[];
    } catch (error) {
      console.error('Error getting external tips by tip link:', error);
      throw error;
    }
  }

  /**
   * Get external tips by recipient ID
   */
  static async getByRecipientId(recipientId: string, limitCount: number = 20): Promise<ExternalTip[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('recipientId', '==', recipientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as ExternalTip[];
    } catch (error) {
      console.error('Error getting external tips by recipient:', error);
      throw error;
    }
  }

  /**
   * Update external tip
   */
  static async update(id: string, updates: Partial<ExternalTip>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating external tip:', error);
      throw error;
    }
  }

  /**
   * Delete external tip
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting external tip:', error);
      throw error;
    }
  }

  /**
   * Get external tips statistics for a recipient
   */
  static async getStatsByRecipientId(recipientId: string): Promise<{
    totalTips: number;
    totalAmount: number;
    completedTips: number;
    pendingTips: number;
    averageTip: number;
  }> {
    try {
      const tips = await this.getByRecipientId(recipientId, 1000); // Get more for stats

      const stats = {
        totalTips: tips.length,
        totalAmount: tips
          .filter(tip => tip.status === 'completed')
          .reduce((sum, tip) => sum + tip.recipientAmount, 0),
        completedTips: tips.filter(tip => tip.status === 'completed').length,
        pendingTips: tips.filter(tip => tip.status === 'pending').length,
        averageTip: tips.length > 0
          ? tips
              .filter(tip => tip.status === 'completed')
              .reduce((sum, tip) => sum + tip.recipientAmount, 0) /
            tips.filter(tip => tip.status === 'completed').length || 0
          : 0,
      };

      return stats;
    } catch (error) {
      console.error('Error getting external tips stats:', error);
      throw error;
    }
  }
}
