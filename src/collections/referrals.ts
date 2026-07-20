import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  bonus: number;
  status: 'pending' | 'completed' | 'cancelled';
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: {
    referrerName?: string;
    referredName?: string;
    referrerEmail?: string;
    referredEmail?: string;
  };
}

export class ReferralCollection {
  private collectionName = 'referrals';

  // Create a new referral
  async create(referralData: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Promise<Referral> {
    const referralRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const referral: Referral = {
      ...referralData,
      id: referralRef.id,
      createdAt: now,
      updatedAt: now,
    };

    // Prepare document data, excluding undefined fields
    const docData: any = {
      ...referral,
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
    };

    // Only include completedAt if it exists
    if (referral.completedAt) {
      docData.completedAt = referral.completedAt.toISOString();
    }

    await setDoc(referralRef, docData);

    return referral;
  }

  // Get referral by ID
  async getById(id: string): Promise<Referral | null> {
    const referralRef = doc(db, this.collectionName, id);
    const referralSnap = await getDoc(referralRef);

    if (referralSnap.exists()) {
      const data = referralSnap.data();
      return {
        ...data,
        id: referralSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Referral;
    }

    return null;
  }

  // Get referrals by referrer ID
  async getByReferrerId(referrerId: string, limitCount = 50): Promise<Referral[]> {
    const q = query(
      collection(db, this.collectionName),
      where('referrerId', '==', referrerId),
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
      } as Referral;
    });
  }

  // Get referrals by referred ID
  async getByReferredId(referredId: string): Promise<Referral[]> {
    const q = query(
      collection(db, this.collectionName),
      where('referredId', '==', referredId),
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
      } as Referral;
    });
  }

  // Get referrals by level
  async getByLevel(level: number, limitCount = 100): Promise<Referral[]> {
    const q = query(
      collection(db, this.collectionName),
      where('level', '==', level),
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
      } as Referral;
    });
  }

  // Get referrals by status
  async getByStatus(status: Referral['status'], limitCount = 100): Promise<Referral[]> {
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
      } as Referral;
    });
  }

  // Update referral
  async update(id: string, updates: Partial<Omit<Referral, 'id' | 'createdAt'>>): Promise<void> {
    const referralRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt.toISOString();
    }

    await updateDoc(referralRef, updateData);
  }

  // Mark referral as completed
  async markCompleted(id: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  // Mark referral as cancelled
  async markCancelled(id: string): Promise<void> {
    await this.update(id, {
      status: 'cancelled',
    });
  }

  // Get referral statistics for a user
  async getStatistics(referrerId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalBonus: number;
    levelBreakdown: {
      level: number;
      count: number;
      bonus: number;
    }[];
  }> {
    const referrals = await this.getByReferrerId(referrerId, 1000); // Get all referrals

    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalBonus: 0,
      levelBreakdown: [] as { level: number; count: number; bonus: number }[],
    };

    const levelMap = new Map<number, { count: number; bonus: number }>();

    referrals.forEach(referral => {
      if (referral.status === 'completed') {
        stats.completedReferrals++;
        stats.totalBonus += referral.bonus;
      } else if (referral.status === 'pending') {
        stats.pendingReferrals++;
      }

      // Update level breakdown
      const levelData = levelMap.get(referral.level) || { count: 0, bonus: 0 };
      levelData.count++;
      if (referral.status === 'completed') {
        levelData.bonus += referral.bonus;
      }
      levelMap.set(referral.level, levelData);
    });

    stats.levelBreakdown = Array.from(levelMap.entries()).map(([level, data]) => ({
      level,
      count: data.count,
      bonus: data.bonus,
    }));

    return stats;
  }

  // Check if user was referred by another user
  async getReferralByReferredId(referredId: string): Promise<Referral | null> {
    const referrals = await this.getByReferredId(referredId);
    return referrals.length > 0 ? referrals[0] : null;
  }

  // Get all referrals (admin function)
  async getAll(limitCount = 100): Promise<Referral[]> {
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
      } as Referral;
    });
  }

  // Get pending referrals (admin function)
  async getPendingReferrals(limitCount = 50): Promise<Referral[]> {
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
      } as Referral;
    });
  }

  // Process referral bonus (when referred user completes certain actions)
  async processReferralBonus(referralId: string): Promise<void> {
    const referral = await this.getById(referralId);
    if (!referral || referral.status !== 'pending') {
      throw new Error('Invalid referral or already processed');
    }

    // Mark referral as completed
    await this.markCompleted(referralId);

    // TODO: Create transaction for referral bonus
    // TODO: Update wallet balance
    // This would typically be handled by a backend service
  }
}

export const referralCollection = new ReferralCollection();
