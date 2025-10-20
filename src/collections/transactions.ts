import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'tip_sent' | 'tip_received' | 'referral_bonus' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  recipientId?: string;
  senderId?: string;
  paymentMethod?: string;
  currency: string;
  fee?: number;
  netAmount: number;
  metadata?: {
    paystackReference?: string;
    flutterwaveReference?: string;
    bankDetails?: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    };
    tipDetails?: {
      message: string;
      isAnonymous: boolean;
    };
    referralDetails?: {
      level: number;
      referrerId: string;
    };
    whatsappMessageId?: string;
    tipId?: string;
    referredId?: string;
    platform?: string;
    level?: number;
    isAnonymous?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class TransactionCollection {
  private collectionName = 'transactions';

  // Create a new transaction
  async create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transactionRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const transaction: Transaction = {
      ...transactionData,
      id: transactionRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(transactionRef, {
      ...transaction,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      completedAt: transaction.completedAt?.toISOString(),
    });

    return transaction;
  }

  // Get transaction by ID
  async getById(id: string): Promise<Transaction | null> {
    const transactionRef = doc(db, this.collectionName, id);
    const transactionSnap = await getDoc(transactionRef);

    if (transactionSnap.exists()) {
      const data = transactionSnap.data();
      return {
        ...data,
        id: transactionSnap.id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Transaction;
    }

    return null;
  }

  // Get transaction by reference
  async getByReference(reference: string): Promise<Transaction | null> {
    const q = query(
      collection(db, this.collectionName),
      where('reference', '==', reference)
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
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Transaction;
    }

    return null;
  }

  // Get user's transactions
  async getByUserId(
    userId: string,
    limitCount = 20,
    startAfterDoc?: any
  ): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
    lastDoc?: any;
  }> {
    let q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1) // +1 to check if there are more
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.slice(0, limitCount).map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Transaction;
    });

    const hasMore = querySnapshot.docs.length > limitCount;
    const lastDoc = hasMore ? querySnapshot.docs[limitCount - 1] : undefined;

    return {
      transactions,
      hasMore,
      lastDoc,
    };
  }

  // Get transactions by type
  async getByType(
    userId: string,
    type: Transaction['type'],
    limitCount = 20
  ): Promise<Transaction[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('type', '==', type),
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
      } as Transaction;
    });
  }

  // Get transactions by status
  async getByStatus(
    userId: string,
    status: Transaction['status'],
    limitCount = 20
  ): Promise<Transaction[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
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
      } as Transaction;
    });
  }

  // Update transaction
  async update(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<void> {
    const transactionRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.completedAt instanceof Date) {
      updateData.completedAt = updates.completedAt.toISOString();
    }

    await updateDoc(transactionRef, updateData);
  }

  // Mark transaction as completed
  async markCompleted(id: string, reference?: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
      reference,
    });
  }

  // Mark transaction as failed
  async markFailed(id: string, reason?: string): Promise<void> {
    await this.update(id, {
      status: 'failed',
      description: reason || 'Transaction failed',
    });
  }

  // Get transaction statistics
  async getStatistics(userId: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    deposits: { count: number; amount: number };
    withdrawals: { count: number; amount: number };
    tips: { sent: { count: number; amount: number }; received: { count: number; amount: number } };
    referralBonuses: { count: number; amount: number };
    pendingTransactions: number;
    failedTransactions: number;
  }> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      } as Transaction;
    });

    const stats = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      deposits: { count: 0, amount: 0 },
      withdrawals: { count: 0, amount: 0 },
      tips: {
        sent: { count: 0, amount: 0 },
        received: { count: 0, amount: 0 }
      },
      referralBonuses: { count: 0, amount: 0 },
      pendingTransactions: 0,
      failedTransactions: 0,
    };

    transactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        stats.totalAmount += transaction.amount;

        switch (transaction.type) {
          case 'deposit':
            stats.deposits.count++;
            stats.deposits.amount += transaction.amount;
            break;
          case 'withdrawal':
            stats.withdrawals.count++;
            stats.withdrawals.amount += transaction.amount;
            break;
          case 'tip_sent':
            stats.tips.sent.count++;
            stats.tips.sent.amount += transaction.amount;
            break;
          case 'tip_received':
            stats.tips.received.count++;
            stats.tips.received.amount += transaction.amount;
            break;
          case 'referral_bonus':
            stats.referralBonuses.count++;
            stats.referralBonuses.amount += transaction.amount;
            break;
        }
      } else if (transaction.status === 'pending') {
        stats.pendingTransactions++;
      } else if (transaction.status === 'failed') {
        stats.failedTransactions++;
      }
    });

    return stats;
  }

  // Get recent transactions (last 24 hours)
  async getRecentTransactions(userId: string, hours = 24): Promise<Transaction[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
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
      } as Transaction;
    });
  }

  // Get transactions between dates
  async getTransactionsBetweenDates(
    userId: string,
    startDate: Date,
    endDate: Date,
    limitCount = 100
  ): Promise<Transaction[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString()),
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
      } as Transaction;
    });
  }

  // Get all transactions (admin function)
  async getAll(limitCount = 100): Promise<Transaction[]> {
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
      } as Transaction;
    });
  }

  // Get pending transactions (admin function)
  async getPendingTransactions(limitCount = 50): Promise<Transaction[]> {
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
      } as Transaction;
    });
  }
}

export const transactionCollection = new TransactionCollection();
