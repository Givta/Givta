import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

export interface User {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified: boolean;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  referralCode: string;
  referredBy?: string;
  referralLevel: number;
  totalReferrals: number;
  totalEarnings: number;
  preferences: {
    notifications: boolean;
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
  };
  kycStatus: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  kycDocuments?: {
    idCard?: string;
    passport?: string;
    utilityBill?: string;
  };
  whatsappId?: string;
  deviceTokens: string[];
  userType: 'user' | 'admin' | 'moderator';
  phoneVerified: boolean;
}

export class UserCollection {
  private collectionName = 'users';

  // Create a new user
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const user: User = {
      ...userData,
      id: userRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    });

    return user;
  }

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const userRef = doc(db, this.collectionName, id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        id: userSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    }

    return null;
  }

  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    const q = query(
      collection(db, this.collectionName),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    }

    return null;
  }

  // Get user by referral code
  async getByReferralCode(referralCode: string): Promise<User | null> {
    const q = query(
      collection(db, this.collectionName),
      where('referralCode', '==', referralCode)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    }

    return null;
  }

  // Get user by phone number
  async getByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const q = query(
      collection(db, this.collectionName),
      where('phoneNumber', '==', phoneNumber)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    }

    return null;
  }

  // Get user by display name (username)
  async getByDisplayName(displayName: string): Promise<User | null> {
    const q = query(
      collection(db, this.collectionName),
      where('displayName', '==', displayName)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    }

    return null;
  }

  // Search users by display name (for tipping)
  async searchByDisplayName(searchTerm: string, limit: number = 10): Promise<User[]> {
    try {
      // Note: Firestore doesn't support case-insensitive searches or partial matches
      // In production, you might want to use Algolia or implement a search index
      const q = query(
        collection(db, this.collectionName),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
        } as User);
      });

      return users.slice(0, limit);
    } catch (error) {
      console.error('Search users by display name error:', error);
      return [];
    }
  }

  // Update user
  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>> & { lastLoginAt?: Date | string }
  ): Promise<void> {
    const userRef = doc(db, this.collectionName, id);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.lastLoginAt instanceof Date) {
      updateData.lastLoginAt = updates.lastLoginAt.toISOString();
    } else if (typeof updates.lastLoginAt === 'string') {
      updateData.lastLoginAt = updates.lastLoginAt;
    }

    await updateDoc(userRef, updateData);
  }

  // Update user login time
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLoginAt: new Date() });
  }

  // Get user's referrals
  async getReferrals(userId: string): Promise<User[]> {
    const q = query(
      collection(db, this.collectionName),
      where('referredBy', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      } as User;
    });
  }

  // Generate unique referral code
  generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Check if referral code is unique
  async isReferralCodeUnique(code: string): Promise<boolean> {
    const q = query(
      collection(db, this.collectionName),
      where('referralCode', '==', code)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  }

  // Get unique referral code
  async getUniqueReferralCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    do {
      code = this.generateReferralCode();
      isUnique = await this.isReferralCodeUnique(code);
    } while (!isUnique);

    return code;
  }
}

export const userCollection = new UserCollection();
