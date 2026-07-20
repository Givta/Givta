"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletCollection = exports.WalletCollection = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase/firestore");
class WalletCollection {
    constructor() {
        this.collectionName = 'wallets';
    }
    // Create a new wallet
    async create(walletData) {
        const walletRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, this.collectionName));
        const now = new Date();
        const wallet = {
            ...walletData,
            id: walletRef.id,
            createdAt: now,
            updatedAt: now,
        };
        const docData = {
            ...wallet,
            createdAt: wallet.createdAt.toISOString(),
            updatedAt: wallet.updatedAt.toISOString(),
        };
        // Only include lastTransactionAt if it exists
        if (wallet.lastTransactionAt) {
            docData.lastTransactionAt = wallet.lastTransactionAt.toISOString();
        }
        await (0, firestore_1.setDoc)(walletRef, docData);
        return wallet;
    }
    // Get wallet by ID
    async getById(id) {
        const walletRef = (0, firestore_1.doc)(firebase_1.db, this.collectionName, id);
        const walletSnap = await (0, firestore_1.getDoc)(walletRef);
        if (walletSnap.exists()) {
            const data = walletSnap.data();
            return {
                ...data,
                id: walletSnap.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
            };
        }
        return null;
    }
    // Get wallet by user ID
    async getByUserId(userId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, this.collectionName), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.where)('isActive', '==', true));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
            };
        }
        return null;
    }
    // Update wallet
    async update(id, updates) {
        const walletRef = (0, firestore_1.doc)(firebase_1.db, this.collectionName, id);
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        // Convert dates to ISO strings
        if (updates.lastTransactionAt) {
            updateData.lastTransactionAt = updates.lastTransactionAt.toISOString();
        }
        await (0, firestore_1.updateDoc)(walletRef, updateData);
    }
    // Update wallet balance
    async updateBalance(id, amount, operation) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
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
    async addDeposit(id, amount) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
        await this.update(id, {
            balance: wallet.balance + amount,
            totalDeposits: wallet.totalDeposits + amount,
            lastTransactionAt: new Date(),
        });
    }
    // Add withdrawal amount
    async addWithdrawal(id, amount) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
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
    async addTipSent(id, amount) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
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
    async addTipReceived(id, amount) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
        await this.update(id, {
            balance: wallet.balance + amount,
            totalTipsReceived: wallet.totalTipsReceived + amount,
            lastTransactionAt: new Date(),
        });
    }
    // Add referral earnings
    async addReferralEarnings(id, amount) {
        const wallet = await this.getById(id);
        if (!wallet)
            throw new Error('Wallet not found');
        await this.update(id, {
            balance: wallet.balance + amount,
            totalReferralEarnings: wallet.totalReferralEarnings + amount,
            lastTransactionAt: new Date(),
        });
    }
    // Get wallet statistics
    async getStatistics(userId) {
        const wallet = await this.getByUserId(userId);
        if (!wallet)
            return null;
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
    async deactivate(id) {
        await this.update(id, { isActive: false });
    }
    // Reactivate wallet
    async reactivate(id) {
        await this.update(id, { isActive: true });
    }
    // Get all active wallets (admin function)
    async getAllActive(limitCount = 100) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, this.collectionName), (0, firestore_1.where)('isActive', '==', true), (0, firestore_1.orderBy)('updatedAt', 'desc'), (0, firestore_1.limit)(limitCount));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
            };
        });
    }
    // Get wallets with low balance (admin function)
    async getLowBalanceWallets(threshold = 100) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, this.collectionName), (0, firestore_1.where)('isActive', '==', true), (0, firestore_1.where)('balance', '<', threshold));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                lastTransactionAt: data.lastTransactionAt ? new Date(data.lastTransactionAt) : undefined,
            };
        });
    }
}
exports.WalletCollection = WalletCollection;
exports.walletCollection = new WalletCollection();
//# sourceMappingURL=wallets.js.map