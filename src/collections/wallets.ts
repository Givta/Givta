import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTipsSent: number;
  totalTipsReceived: number;
  totalReferralEarnings: number;
  lastTransactionAt?: Date;
  encryptedPin?: string;
  failedPinAttempts: number;
  pinLockedUntil?: Date;
}

export class WalletCollection {
  private collectionName = 'wallets';

  // Create a new wallet
  async create(walletData: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    const walletRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const wallet: Wallet = {
      ...walletData,
      id: walletRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(walletRef, {
      ...wallet,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
      lastTransactionAt: wallet.lastTransactionAt?.toISOString(),
    });

    return wallet;
  }

  // Get wallet by ID
  async getById(id: string): Promise<Wallet | null> {
    const walletRef = doc(db, this.collectionName, id);
    const walletSnap = await getDoc(walletRef);

    if (walletSnap.exists()) {
      const data = walletSnap.data();
      return {
        ...data,
        id: walletSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
      } as Wallet;
    }

    return null;
  }

  // Get wallet by user ID
  async getByUserId(userId: string): Promise<Wallet | null> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('isActive', '==', true)
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
        lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
      } as Wallet;
    }

    return null;
  }

  // Update wallet
  async update(id: string, updates: Partial<Omit<Wallet, 'id' | 'createdAt'>>): Promise<void> {
    const walletRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.lastTransactionAt) {
      updateData.lastTransactionAt = updates.lastTransactionAt.toISOString();
    }

    await updateDoc(walletRef, updateData);
  }

  // Update wallet balance
  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = operation === 'add'
      ? wallet.balance + amount
      : wallet.balance - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    await this.update(id, {
      balance: newBalance,
      lastTransactionAt: new Date(),
    });
  }

  // Add deposit amount
  async addDeposit(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    await this.update(id, {
      balance: wallet.balance + amount,
      totalDeposits: wallet.totalDeposits + amount,
      lastTransactionAt: new Date(),
    });
  }

  // Add withdrawal amount
  async addWithdrawal(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.update(id, {
      balance: wallet.balance - amount,
      totalWithdrawals: wallet.totalWithdrawals + amount,
      lastTransactionAt: new Date(),
    });
  }

  // Add tip sent
  async addTipSent(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.update(id, {
      balance: wallet.balance - amount,
      totalTipsSent: wallet.totalTipsSent + amount,
      lastTransactionAt: new Date(),
    });
  }

  // Add tip received
  async addTipReceived(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    await this.update(id, {
      balance: wallet.balance + amount,
      totalTipsReceived: wallet.totalTipsReceived + amount,
      lastTransactionAt: new Date(),
    });
  }

  // Add referral earnings
  async addReferralEarnings(id: string, amount: number): Promise<void> {
    const wallet = await this.getById(id);
    if (!wallet) throw new Error('Wallet not found');

    await this.update(id, {
      balance: wallet.balance + amount,
      totalReferralEarnings: wallet.totalReferralEarnings + amount,
      lastTransactionAt: new Date(),
    });
  }

  // Get wallet statistics
  async getStatistics(userId: string): Promise<{
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalTipsSent: number;
    totalTipsReceived: number;
    totalReferralEarnings: number;
    netEarnings: number;
  } | null> {
    const wallet = await this.getByUserId(userId);
    if (!wallet) return null;

    return {
      totalBalance: wallet.balance,
      totalDeposits: wallet.totalDeposits,
      totalWithdrawals: wallet.totalWithdrawals,
      totalTipsSent: wallet.totalTipsSent,
      totalTipsReceived: wallet.totalTipsReceived,
      totalReferralEarnings: wallet.totalReferralEarnings,
      netEarnings: wallet.totalTipsReceived + wallet.totalReferralEarnings - wallet.totalTipsSent,
    };
  }

  // Deactivate wallet
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  // Reactivate wallet
  async reactivate(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  }

  // Get all active wallets (admin function)
  async getAllActive(limitCount = 100): Promise<Wallet[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc'),
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
        lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
      } as Wallet;
    });
  }

  // Get wallets with low balance (admin function)
  async getLowBalanceWallets(threshold = 100): Promise<Wallet[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      where('balance', '<', threshold)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
      } as Wallet;
    });
  }
}

export const walletCollection = new WalletCollection();
