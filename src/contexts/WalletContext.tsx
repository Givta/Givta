import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { walletCollection } from '../collections/wallets';
import { transactionCollection, Transaction } from '../collections/transactions';

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number, bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }) => Promise<void>;
  tip: (recipientId: string, amount: number, description: string) => Promise<void>;
  processTipViaLink: (receiverIdentifier: string, amount: number) => Promise<any>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBalance = async () => {
    if (!user?.id) return;

    try {
      const wallet = await walletCollection.getByUserId(user.id);
      if (wallet) {
        setBalance(wallet.balance);
      } else {
        // Create wallet if it doesn't exist
        const newWallet = await walletCollection.create({
          userId: user.id,
          balance: 0,
          currency: 'NGN',
          isActive: true,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          failedPinAttempts: 0,
        });
        setBalance(newWallet.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const refreshTransactions = async () => {
    if (!user?.id) return;

    try {
      const result = await transactionCollection.getByUserId(user.id, 20);
      setTransactions(result.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const deposit = async (amount: number) => {
    if (!user?.id) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Get or create wallet
      let wallet = await walletCollection.getByUserId(user.id);
      if (!wallet) {
        wallet = await walletCollection.create({
          userId: user.id,
          balance: 0,
          currency: 'NGN',
          isActive: true,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          failedPinAttempts: 0,
        });
      }

      // Create deposit transaction
      await transactionCollection.create({
        userId: user.id,
        type: 'deposit',
        amount,
        description: 'Wallet deposit',
        status: 'completed',
        currency: 'NGN',
        netAmount: amount,
        completedAt: new Date(),
      });

      // Update wallet balance
      await walletCollection.addDeposit(wallet.id, amount);

      await refreshBalance();
      await refreshTransactions();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (amount: number, bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Call backend API for withdrawal processing
      const response = await fetch('http://localhost:5000/api/wallets/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          accountNumber: bankDetails?.accountNumber,
          bankCode: bankDetails?.bankCode,
          accountName: bankDetails?.accountName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Withdrawal failed');
      }

      // Refresh balance and transactions to get updated data from backend
      await refreshBalance();
      await refreshTransactions();

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      throw new Error(error.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const tip = async (recipientId: string, amount: number, description: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Get sender wallet
      const senderWallet = await walletCollection.getByUserId(user.id);
      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (senderWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Get or create recipient wallet
      let recipientWallet = await walletCollection.getByUserId(recipientId);
      if (!recipientWallet) {
        recipientWallet = await walletCollection.create({
          userId: recipientId,
          balance: 0,
          currency: 'NGN',
          isActive: true,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          failedPinAttempts: 0,
        });
      }

      // Get sender's display name
      const senderName = user.username || 'Anonymous User';

      // Create tip sent transaction for sender
      await transactionCollection.create({
        userId: user.id,
        type: 'tip_sent',
        amount,
        description: `Tip sent to ${recipientId}`, // Generic for sender
        status: 'completed',
        currency: 'NGN',
        netAmount: amount,
        recipientId,
        metadata: {
          tipDetails: {
            message: description,
            isAnonymous: false,
          }
        },
        completedAt: new Date(),
      });

      // Create tip received transaction for recipient with sender's name
      await transactionCollection.create({
        userId: recipientId,
        type: 'tip_received',
        amount,
        description: `Tip received from ${senderName}`,
        status: 'completed',
        currency: 'NGN',
        netAmount: amount,
        senderId: user.id,
        metadata: {
          tipDetails: {
            message: description,
            isAnonymous: false,
          }
        },
        completedAt: new Date(),
      });

      // Update sender wallet (subtract)
      await walletCollection.addTipSent(senderWallet.id, amount);

      // Update recipient wallet (add)
      await walletCollection.addTipReceived(recipientWallet.id, amount);

      await refreshBalance();
      await refreshTransactions();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processTipViaLink = async (receiverIdentifier: string, amount: number) => {
    setLoading(true);
    try {
      // For now, assume receiverIdentifier is a user ID
      // In a real implementation, this would resolve usernames/IDs to user IDs
      const recipientId = receiverIdentifier;

      // Get or create recipient wallet
      let recipientWallet = await walletCollection.getByUserId(recipientId);
      if (!recipientWallet) {
        recipientWallet = await walletCollection.create({
          userId: recipientId,
          balance: 0,
          currency: 'NGN',
          isActive: true,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalTipsSent: 0,
          totalTipsReceived: 0,
          totalReferralEarnings: 0,
          failedPinAttempts: 0,
        });
      }

      // Create tip received transaction for recipient
      const transaction = await transactionCollection.create({
        userId: recipientId,
        type: 'tip_received',
        amount,
        description: 'Tip received via link',
        status: 'completed',
        currency: 'NGN',
        netAmount: amount,
        senderId: user?.id || 'anonymous',
        metadata: {
          tipDetails: {
            message: 'Tip via link',
            isAnonymous: !user,
          }
        },
        completedAt: new Date(),
      });

      // Update recipient wallet (add)
      await walletCollection.addTipReceived(recipientWallet.id, amount);

      // If this is the current user receiving the tip, refresh their data
      if (user && recipientId === user.id) {
        await refreshBalance();
        await refreshTransactions();
      }

      return {
        tipId: transaction.id,
        amount,
        receiverId: recipientId,
        receiverName: 'User', // Would need to fetch actual name
      };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh logic
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  const [appState, setAppState] = useState(AppState.currentState);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasErrorRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const onlineListener = () => handleOnline();
    const offlineListener = () => handleOffline();

    // React Native doesn't have window.addEventListener, use NetInfo
    // For now, we'll use a simplified approach
    // This would need to be enhanced with NetInfo for proper online detection
    setIsOnline(navigator?.onLine ?? true);

    // App visibility detection
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    // Cleanup
    return () => {
      appStateListener?.remove();
    };
  }, []);

  // Smart auto-refresh function
  const performAutoRefresh = useCallback(async () => {
    // Only refresh if user is authenticated, online, and app is visible
    if (!user?.id || !isOnline || appState !== 'active') {
      return;
    }

    // Skip refresh if we had recent errors (backoff strategy)
    if (hasErrorRef.current && consecutiveErrorsRef.current > 2) {
      // Wait for manual refresh or app restart to reset
      return;
    }

    try {
      // Perform concurrent refresh with error handling
      const [balanceResult, transactionsResult] = await Promise.allSettled([
        refreshBalance(),
        refreshTransactions()
      ]);

      // Handle results and reset error state on success
      const balanceSuccess = balanceResult.status === 'fulfilled';
      const transactionsSuccess = transactionsResult.status === 'fulfilled';

      if (balanceSuccess || transactionsSuccess) {
        hasErrorRef.current = false;
        consecutiveErrorsRef.current = 0;
      } else {
        // Both failed
        throw new Error('Both balance and transactions refresh failed');
      }
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
      hasErrorRef.current = true;
      consecutiveErrorsRef.current = consecutiveErrorsRef.current + 1;

      // If too many consecutive errors, clear the timer and require manual refresh
      if (consecutiveErrorsRef.current > 5) {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    }
  }, [user?.id, isOnline, appState, refreshBalance, refreshTransactions]);

  // Auto-refresh timer setup
  useEffect(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Setup new timer if conditions are met
    if (user?.id && isOnline && appState === 'active') {
      // Log that auto-refresh is starting
      console.log('Starting wallet auto-refresh (20s intervals)');

      // Perform immediate refresh when becoming active
      performAutoRefresh();

      // Set up 20-second intervals
      refreshTimerRef.current = setInterval(() => {
        performAutoRefresh();
      }, 20000); // 20 seconds
    }

    // Cleanup function
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user?.id, isOnline, appState, performAutoRefresh]);

  // Manual refresh functions that reset error state
  const refreshBalanceWithReset = useCallback(async () => {
    hasErrorRef.current = false;
    consecutiveErrorsRef.current = 0;
    await refreshBalance();
  }, [refreshBalance]);

  const refreshTransactionsWithReset = useCallback(async () => {
    hasErrorRef.current = false;
    consecutiveErrorsRef.current = 0;
    await refreshTransactions();
  }, [refreshTransactions]);

  useEffect(() => {
    if (user) {
      refreshBalanceWithReset();
      refreshTransactionsWithReset();
    }
  }, [user]);

  const value = {
    balance,
    transactions,
    loading,
    deposit,
    withdraw,
    tip,
    processTipViaLink,
    refreshBalance: refreshBalanceWithReset,
    refreshTransactions: refreshTransactionsWithReset,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
