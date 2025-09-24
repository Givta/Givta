import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PaystackWebView } from '../components/PaystackWebView';
import { paystackService } from '../services/paystack';

type PaymentType = 'deposit' | 'withdraw';

interface PaymentScreenProps {
  paymentType: PaymentType;
}

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: PaymentScreenProps }, 'params'>>();
  const { user } = useAuth();
  const { balance, deposit, withdraw } = useWallet();

  const paymentType = route.params?.paymentType || 'deposit';
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isDeposit = paymentType === 'deposit';

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    if (numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!isDeposit && numAmount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (isDeposit) {
      // Show Paystack WebView for payment
      setShowPaystack(true);
    } else {
      // Handle withdrawal
      await handleWithdrawal();
    }
  };

  const handleWithdrawal = async () => {
    try {
      setLoading(true);
      await withdraw(numAmount, {
        accountNumber: '1234567890', // This should come from user input
        bankCode: '044', // This should come from user input
        accountName: 'John Doe', // This should come from user input
      });
      Alert.alert('Success', 'Withdrawal request submitted successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (response: any) => {
    try {
      setShowPaystack(false);

      // Verify payment on backend
      const verified = await paystackService.verifyPayment(response.transactionRef);

      if (verified) {
        // Update wallet balance
        await deposit(numAmount);
        Alert.alert('Success', 'Payment successful! Your wallet has been credited.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Payment verification failed. Please contact support.');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    }
  };

  const handlePaystackCancel = () => {
    setShowPaystack(false);
    Alert.alert('Payment Cancelled', 'Payment was cancelled');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const quickAmounts = [1000, 2000, 5000, 10000];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
          </Text>
          <Text style={styles.subtitle}>
            {isDeposit
              ? 'Add money to your Givta wallet'
              : 'Transfer money from your wallet'
            }
          </Text>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard} padding={20} margin={16}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        </Card>

        {/* Amount Input */}
        <Card style={styles.amountCard} padding={24} margin={16}>
          <Text style={styles.amountLabel}>Amount (NGN)</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            <Text style={styles.quickLabel}>Quick amounts:</Text>
            <View style={styles.quickButtons}>
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  title={formatCurrency(quickAmount)}
                  onPress={() => setAmount(quickAmount.toString())}
                  variant="outline"
                  size="small"
                  style={styles.quickButton}
                />
              ))}
            </View>
          </View>

          {/* Fee Information */}
          {numAmount > 0 && (
            <Card style={styles.feeCard} padding={16} margin={0}>
              <Text style={styles.feeTitle}>Transaction Summary</Text>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Amount:</Text>
                <Text style={styles.feeValue}>{formatCurrency(numAmount)}</Text>
              </View>
              {isDeposit && (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Processing Fee:</Text>
                  <Text style={styles.feeValue}>{formatCurrency(0)}</Text>
                </View>
              )}
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>
                  {isDeposit ? 'Total to Pay:' : 'Amount to Receive:'}
                </Text>
                <Text style={styles.totalValue}>{formatCurrency(numAmount)}</Text>
              </View>
            </Card>
          )}

          <Button
            title={isDeposit ? 'Proceed to Payment' : 'Withdraw Funds'}
            onPress={handlePayment}
            loading={loading}
            disabled={numAmount <= 0 || (!isDeposit && numAmount > balance)}
            style={styles.paymentButton}
          />
        </Card>

        {/* Payment Methods Info */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.infoTitle}>Payment Information</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💳</Text>
              <Text style={styles.infoText}>
                {isDeposit
                  ? 'Secure payment powered by Paystack'
                  : 'Funds will be transferred to your linked account'
                }
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⚡</Text>
              <Text style={styles.infoText}>
                {isDeposit
                  ? 'Instant credit to your wallet'
                  : 'Processing time: 1-3 business days'
                }
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🔒</Text>
              <Text style={styles.infoText}>
                256-bit SSL encryption for security
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Paystack WebView Modal */}
      <Modal
        visible={showPaystack}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaystack(false)}
      >
        <PaystackWebView
          amount={numAmount}
          onSuccess={handlePaystackSuccess}
          onCancel={handlePaystackCancel}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  balanceCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  amountCard: {
    backgroundColor: '#fff',
  },
  amountLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#4B0082',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  quickAmounts: {
    marginBottom: 20,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickButton: {
    width: '48%',
    marginBottom: 8,
  },
  feeCard: {
    backgroundColor: '#f8f9fa',
    marginVertical: 16,
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#8e8e93',
  },
  feeValue: {
    fontSize: 14,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  },
  paymentButton: {
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    flex: 1,
    lineHeight: 20,
  },
});
