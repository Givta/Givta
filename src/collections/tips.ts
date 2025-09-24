import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface Tip {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  description: string;
  isAnonymous: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  currency: string;
  fee: number;
  netAmount: number; // Amount after fee deduction
  metadata?: {
    senderName?: string;
    recipientName?: string;
    senderEmail?: string;
    recipientEmail?: string;
    message?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class TipCollection {
  private collectionName = 'tips';

  // Create a new tip
  async create(tipData: Omit<Tip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tip> {
    const tipRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const tip: Tip = {
      ...tipData,
      id: tipRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(tipRef, {
      ...tip,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
      completedAt: tip.completedAt?.toISOString(),
    });

    return tip;
  }

  // Get tip by ID
  async getById(id: string): Promise<Tip | null> {
    const tipRef = doc(db, this.collectionName, id);
    const tipSnap = await getDoc(tipRef);

    if (tipSnap.exists()) {
      const data = tipSnap.data();
      return {
        ...data,
        id: tipSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    }

    return null;
  }

  // Get tips sent by user
  async getSentByUser(userId: string, limitCount = 20): Promise<Tip[]> {
    const q = query(
      collection(db, this.collectionName),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }

  // Get tips received by user
  async getReceivedByUser(userId: string, limitCount = 20): Promise<Tip[]> {
    const q = query(
      collection(db, this.collectionName),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }

  // Get tips between two users
  async getBetweenUsers(userId1: string, userId2: string, limitCount = 20): Promise<Tip[]> {
    const q1 = query(
      collection(db, this.collectionName),
      where('senderId', '==', userId1),
      where('recipientId', '==', userId2),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const q2 = query(
      collection(db, this.collectionName),
      where('senderId', '==', userId2),
      where('recipientId', '==', userId1),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const tips1 = snapshot1.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });

    const tips2 = snapshot2.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });

    // Combine and sort by creation date
    return [...tips1, ...tips2]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);
  }

  // Get tips by status
  async getByStatus(status: Tip['status'], limitCount = 100): Promise<Tip[]> {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }

  // Update tip
  async update(id: string, updates: Partial<Omit<Tip, 'id' | 'createdAt'>>): Promise<void> {
    const tipRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt.toISOString();
    }

    await updateDoc(tipRef, updateData);
  }

  // Mark tip as completed
  async markCompleted(id: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  // Mark tip as failed
  async markFailed(id: string): Promise<void> {
    await this.update(id, {
      status: 'failed',
    });
  }

  // Calculate tip fee (5% platform fee)
  calculateFee(amount: number): { fee: number; netAmount: number } {
    const fee = Math.round(amount * 0.05); // 5% fee
    const netAmount = amount - fee;
    return { fee, netAmount };
  }

  // Create a tip with automatic fee calculation
  async createTip(
    senderId: string,
    recipientId: string,
    amount: number,
    description: string,
    isAnonymous = false,
    paymentMethod = 'wallet'
  ): Promise<Tip> {
    const { fee, netAmount } = this.calculateFee(amount);

    return this.create({
      senderId,
      recipientId,
      amount,
      description,
      isAnonymous,
      status: 'pending',
      paymentMethod,
      currency: 'NGN',
      fee,
      netAmount,
    });
  }

  // Get tip statistics for user
  async getStatistics(userId: string): Promise<{
    totalSent: number;
    totalReceived: number;
    totalAmountSent: number;
    totalAmountReceived: number;
    totalFeesPaid: number;
    averageTipSent: number;
    averageTipReceived: number;
    tipsCount: number;
  }> {
    const [sentTips, receivedTips] = await Promise.all([
      this.getSentByUser(userId, 1000),
      this.getReceivedByUser(userId, 1000),
    ]);

    const stats = {
      totalSent: sentTips.length,
      totalReceived: receivedTips.length,
      totalAmountSent: 0,
      totalAmountReceived: 0,
      totalFeesPaid: 0,
      averageTipSent: 0,
      averageTipReceived: 0,
      tipsCount: sentTips.length + receivedTips.length,
    };

    sentTips.forEach(tip => {
      if (tip.status === 'completed') {
        stats.totalAmountSent += tip.amount;
        stats.totalFeesPaid += tip.fee;
      }
    });

    receivedTips.forEach(tip => {
      if (tip.status === 'completed') {
        stats.totalAmountReceived += tip.netAmount;
      }
    });

    stats.averageTipSent = stats.totalSent > 0 ? stats.totalAmountSent / stats.totalSent : 0;
    stats.averageTipReceived = stats.totalReceived > 0 ? stats.totalAmountReceived / stats.totalReceived : 0;

    return stats;
  }

  // Get recent tips (last 24 hours)
  async getRecentTips(userId: string, hours = 24): Promise<Tip[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const q = query(
      collection(db, this.collectionName),
      where('senderId', '==', userId),
      where('createdAt', '>=', since.toISOString()),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }

  // Get top tippers (admin function)
  async getTopTippers(limitCount = 10): Promise<{
    userId: string;
    totalAmount: number;
    tipsCount: number;
  }[]> {
    // This would require aggregation which Firestore doesn't support directly
    // Would need to be implemented with a backend service or Cloud Functions
    return [];
  }

  // Get all tips (admin function)
  async getAll(limitCount = 100): Promise<Tip[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }

  // Get pending tips (admin function)
  async getPendingTips(limitCount = 50): Promise<Tip[]> {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Tip;
    });
  }
}

export const tipCollection = new TipCollection();
