import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PaystackWebView } from '../components/PaystackWebView';
import { apiService } from '../services/api';

type PaymentType = 'deposit' | 'withdraw';

interface PaymentScreenProps {
  paymentType: PaymentType;
}

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: PaymentScreenProps }, 'params'>>();
  const { user } = useAuth();
  const { balance, deposit, withdraw, refreshBalance } = useWallet();

  const paymentType = route.params?.paymentType || 'deposit';
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Withdrawal specific fields
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountName, setAccountName] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isDeposit = paymentType === 'deposit';

  // Load banks on component mount for withdrawals
  useEffect(() => {
    if (!isDeposit) {
      loadBanks();
    }
  }, [isDeposit]);

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/payments/banks`, {
        headers: {
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Sort banks by name and filter live banks
        const sortedBanks = data.data
          .filter((bank: any) => bank.active && !bank.name.includes('Test'))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        setAvailableBanks(sortedBanks);
      } else {
        console.error('Failed to load banks:', data.error);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

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
      // Initialize deposit payment
      await handleDeposit();
    } else {
      // Handle withdrawal
      await handleWithdrawal();
    }
  };

  const handleDeposit = async () => {
    try {
      setLoading(true);

      // Call the new deposit endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/wallets/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod: 'paystack'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store payment URL and reference
        setPaymentUrl(data.data.paymentUrl);
        setPaymentReference(data.data.reference);
        // Open payment URL in Paystack WebView
        setShowPaystack(true);
      } else {
        throw new Error(data.error || 'Failed to initialize deposit');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initialize deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    // Validate withdrawal-specific fields
    if (!accountNumber.trim() || !bankCode.trim() || !accountName.trim()) {
      Alert.alert('Error', 'Please verify bank account details first');
      return;
    }

    if (accountNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit account number');
      return;
    }

    try {
      setLoading(true);

      // Calculate fee (2.3% as per wallet route)
      const fee = Math.round(numAmount * 0.023);
      const netAmount = numAmount - fee;

      // Submit withdrawal request for admin approval
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/wallets/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          accountNumber: accountNumber.trim(),
          bankCode: bankCode.trim(),
          bankName: selectedBank?.name || '',
          accountName: accountName.trim(),
          description: 'Withdrawal request from Givta app',
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Withdrawal Requested',
          `Your withdrawal request has been submitted for review.\n\nAmount: ${formatCurrency(numAmount)}\nFee: ${formatCurrency(fee)}\nYou'll receive: ${formatCurrency(netAmount)}\n\nProcessing may take 1-3 business days.`
        );
        navigation.goBack();
      } else {
        throw new Error(data.error || 'Withdrawal request failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber.trim() || accountNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit account number');
      return;
    }

    if (!bankCode.trim()) {
      Alert.alert('Error', 'Please select a bank');
      return;
    }

    try {
      setVerifyingAccount(true);

      const result = await apiService.validateBankAccount(accountNumber.trim(), bankCode.trim());

      if (result.success && result.data) {
        setAccountName(result.data.account_name);
        Alert.alert('Success', `Account verified: ${result.data.account_name}`);
      } else {
        Alert.alert('Error', 'Account verification failed');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to verify account. Please check your details.');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const getBankName = (code: string) => {
    const banks: { [key: string]: string } = {
      '044': 'Access Bank',
      '063': 'Diamond Bank',
      '050': 'Ecobank',
      '011': 'First Bank',
      '058': 'GTBank',
      '030': 'Heritage Bank',
      '069': 'Sterling Bank',
      '057': 'Zenith Bank',
      '035': 'Wema Bank',
      '070': 'Fidelity Bank',
      '067': 'Unity Bank',
      '009': 'Key Stone Bank',
      '231': 'Stanbic IBTC',
      '068': 'Standard Chartered',
      '023': 'Citi Bank',
      '101': 'Providus Bank',
      '076': 'Polaris Bank',
      '082': 'Keystone Bank',
      '084': 'Enterprise Bank',
      '085': 'Ecobank Nigeria',
      '221': 'Stanbic IBTC Bank Nigeria Limited',
      '232': 'Sterling Bank Plc',
      '301': 'Jaiz Bank',
      '304': 'Stanbic Mobile',
      '307': 'Ecobank Mobile',
      '309': 'FBN Mobile',
      '315': 'GTBank Mobile Money',
      '322': 'Zenith Mobile',
      '323': 'Access Mobile',
      '401': 'Aso Savings',
      '305': 'Paycom (OAK)',
      '100': 'Suntrust Bank',
      '102': 'Titan Trust Bank',
    };

    return banks[code] || `Bank Code: ${code}`;
  };

  const handlePaystackSuccess = async (response: any) => {
    try {
      setShowPaystack(false);

      // Refresh balance to show updated amount (webhook should have credited the wallet)
      await refreshBalance();

      // Payment verification is handled in PaystackWebView component
      // Just show success and navigate back
      Alert.alert('Success', 'Payment successful! Your wallet has been credited.');
      navigation.goBack();
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

  const handleBankSelect = (bank: any) => {
    setSelectedBank(bank);
    setBankCode(bank.code);
    setShowBankPicker(false);
  };

  const renderBankItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bankItem}
      onPress={() => handleBankSelect(item)}
    >
      <Text style={styles.bankItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

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

          {/* Bank Account Details for Withdrawals */}
          {!isDeposit && (
            <View style={styles.withdrawalDetails}>
              <Text style={styles.withdrawalTitle}>Bank Account Details</Text>

              <Text style={styles.detailLabel}>Account Number</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="1234567890"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                maxLength={10}
              />

              <Text style={styles.detailLabel}>Select Bank</Text>
              <TouchableOpacity
                style={styles.bankSelector}
                onPress={() => setShowBankPicker(true)}
              >
                <Text style={styles.bankSelectorText}>
                  {selectedBank ? selectedBank.name : 'Choose a bank'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#4B0082" />
              </TouchableOpacity>

{/* Account Name will auto-fill after verification */}
{accountName ? (
  <View>
    <Text style={styles.detailLabel}>✓ Account Holder</Text>
    <Text style={styles.verifiedAccountName}>{accountName}</Text>
  </View>
) : (
  <Button
    title="Get Account Details"
    onPress={handleVerifyAccount}
    loading={verifyingAccount}
    disabled={verifyingAccount || !accountNumber.trim() || accountNumber.length !== 10 || !selectedBank}
    variant="outline"
    style={styles.verifyButton}
  />
)}
            </View>
          )}

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
                <Text style={styles.feeLabel}>Withdrawal Amount:</Text>
                <Text style={styles.feeValue}>{formatCurrency(numAmount)}</Text>
              </View>
              {isDeposit ? (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Processing Fee:</Text>
                  <Text style={styles.feeValue}>{formatCurrency(0)}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Platform Fee (2.3%):</Text>
                    <Text style={styles.feeValueRed}>-{formatCurrency(Math.round(numAmount * 0.023))}</Text>
                  </View>
                  <View style={[styles.feeRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>You'll Receive:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(Math.round(numAmount * 0.96))}</Text>
                  </View>
                </>
              )}
              {isDeposit && (
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total to Pay:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(numAmount)}</Text>
                </View>
              )}
            </Card>
          )}

          <Button
            title={isDeposit ? 'Proceed to Payment' : 'Withdraw Funds'}
            onPress={handlePayment}
            loading={loading}
            disabled={
              numAmount <= 0 ||
              (!isDeposit && numAmount > balance) ||
              (!isDeposit && (
                accountNumber.length !== 10 ||
                !bankCode.trim() ||
                !accountName.trim()
              ))
            }
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
          paymentUrl={paymentUrl}
          onSuccess={handlePaystackSuccess}
          onCancel={handlePaystackCancel}
          reference={paymentReference}
        />
      </Modal>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity
                onPress={() => setShowBankPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1c1c1e" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableBanks}
              renderItem={renderBankItem}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.bankList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#8e8e93' }}>
                    {loadingBanks ? 'Loading banks...' : 'No banks available'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
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
    paddingTop: 15,
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
  feeValueRed: {
    fontSize: 14,
    color: '#dc3545',
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
  withdrawalDetails: {
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  withdrawalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 8,
    marginTop: 12,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  verifyButton: {
    marginTop: 12,
    marginBottom: 12,
  },
  bankName: {
    fontSize: 14,
    color: '#4B0082',
    fontWeight: '500',
    textAlign: 'center',
  },
  bankSelector: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankSelectorText: {
    fontSize: 16,
  },
  bankItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  bankItemText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  closeButton: {
    padding: 5,
  },
  bankList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  verifiedAccountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B0082',
    marginBottom: 8,
  },
});
