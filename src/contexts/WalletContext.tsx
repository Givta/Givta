import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiService, Transaction } from '../services/api';

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
      const response = await apiService.getWallet();
      if (response.success && response.data) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const refreshTransactions = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getTransactions();
      if (response.success && response.data) {
        setTransactions(response.data.transactions.map((t: any) => ({
          ...t,
          timestamp: new Date(t.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const deposit = async (amount: number) => {
    if (!user?.id) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const response = await apiService.deposit(amount, user.email || '');
      if (!response.success) {
        throw new Error(response.error || 'Deposit failed');
      }

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
      const response = await apiService.withdraw(amount, bankDetails);
      if (!response.success) {
        throw new Error(response.error || 'Withdrawal failed');
      }

      await refreshBalance();
      await refreshTransactions();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const tip = async (recipientId: string, amount: number, description: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const response = await apiService.sendTip(recipientId, amount, description);
      if (!response.success) {
        throw new Error(response.error || 'Tip failed');
      }

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
      const response = await apiService.sendTipViaLink(receiverIdentifier, amount);
      if (!response.success) {
        throw new Error(response.error || 'Tip via link failed');
      }

      // If this is the current user receiving the tip, refresh their data
      if (user && response.data?.receiverId === user.id) {
        await refreshBalance();
        await refreshTransactions();
      }

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBalance();
      refreshTransactions();
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
    refreshBalance,
    refreshTransactions,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
