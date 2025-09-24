import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export const TipScreen: React.FC = () => {
  const { balance, refreshBalance } = useWallet();
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValidated, setRecipientValidated] = useState(false);
  const [recentTips, setRecentTips] = useState<any[]>([]);

  const tipAmount = parseFloat(amount) || 0;
  const platformFee = tipAmount * 0.02; // 2% platform fee
  const totalAmount = tipAmount + platformFee;

  // Validate recipient when ID changes
  React.useEffect(() => {
    const validateRecipient = async () => {
      if (!recipientId.trim()) {
        setRecipientValidated(false);
        setRecipientName('');
        return;
      }

      setIsValidatingRecipient(true);
      try {
        const response = await apiService.getUserByTippingIdentifier(recipientId.trim());
        if (response.success && response.data) {
          setRecipientName(response.data.name);
          setRecipientValidated(true);
        } else {
          setRecipientValidated(false);
          setRecipientName('');
        }
      } catch (error) {
        setRecipientValidated(false);
        setRecipientName('');
      } finally {
        setIsValidatingRecipient(false);
      }
    };

    const debounceTimer = setTimeout(validateRecipient, 500);
    return () => clearTimeout(debounceTimer);
  }, [recipientId]);

  // Load recent tips on component mount
  React.useEffect(() => {
    loadRecentTips();
  }, []);

  const loadRecentTips = async () => {
    try {
      const response = await apiService.getTipsSent();
      if (response.success && response.data) {
        setRecentTips(response.data.tips.slice(0, 5)); // Show last 5 tips
      }
    } catch (error) {
      console.error('Error loading recent tips:', error);
    }
  };

  const handleTip = async () => {
    if (!recipientId.trim()) {
      Alert.alert('Error', 'Please enter recipient ID or username');
      return;
    }

    if (!recipientValidated) {
      Alert.alert('Error', 'Please enter a valid recipient');
      return;
    }

    if (tipAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (totalAmount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiService.sendTip(recipientId.trim(), tipAmount, description.trim());

      if (response.success) {
        Alert.alert(
          'Success! 🎉',
          `Tip of ${formatCurrency(tipAmount)} sent to ${recipientName} successfully!\n\nPlatform fee: ${formatCurrency(platformFee)}`,
          [
            {
              text: 'Send Another',
              onPress: () => {
                setRecipientId('');
                setRecipientName('');
                setAmount('');
                setDescription('');
                setRecipientValidated(false);
              }
            },
            {
              text: 'Done',
              style: 'default'
            }
          ]
        );

        // Refresh balance and recent tips
        await refreshBalance();
        await loadRecentTips();
      } else {
        Alert.alert('Error', response.error || 'Failed to send tip');
      }
    } catch (error) {
      console.error('Tip error:', error);
      Alert.alert('Error', 'Failed to send tip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Balance Display */}
        <Card style={styles.balanceCard} padding={16} margin={16}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        </Card>

        {/* Tip Form */}
        <Card style={styles.formCard} padding={20} margin={16}>
          <Text style={styles.formTitle}>Send a Tip</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient ID or Username</Text>
            <View style={styles.recipientInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter recipient's ID or username"
                value={recipientId}
                onChangeText={setRecipientId}
                autoCapitalize="none"
              />
              {isValidatingRecipient && (
                <ActivityIndicator size="small" color="#4B0082" style={styles.validationIndicator} />
              )}
              {recipientValidated && (
                <Ionicons name="checkmark-circle" size={20} color="#34c759" style={styles.validationIndicator} />
              )}
            </View>
            {recipientValidated && recipientName && (
              <Text style={styles.recipientName}>
                <Ionicons name="person" size={14} color="#4B0082" /> {recipientName}
              </Text>
            )}
            {recipientId && !isValidatingRecipient && !recipientValidated && (
              <Text style={styles.recipientError}>
                <Ionicons name="alert-circle" size={14} color="#ff3b30" /> Recipient not found
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (NGN)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder="Why are you tipping?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Fee Breakdown */}
          {tipAmount > 0 && (
            <Card style={styles.feeCard} padding={16} margin={0}>
              <Text style={styles.feeTitle}>Fee Breakdown</Text>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Tip Amount:</Text>
                <Text style={styles.feeValue}>{formatCurrency(tipAmount)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Platform Fee (2%):</Text>
                <Text style={styles.feeValue}>{formatCurrency(platformFee)}</Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </Card>
          )}

          <Button
            title="Send Tip"
            onPress={handleTip}
            loading={isSubmitting}
            disabled={isSubmitting || tipAmount <= 0 || totalAmount > balance}
            style={styles.submitButton}
          />
        </Card>

        {/* Quick Tip Amounts */}
        <Card style={styles.quickTipsCard} padding={16} margin={16}>
          <Text style={styles.quickTipsTitle}>Quick Tips</Text>
          <View style={styles.quickTipButtons}>
            {[50, 100, 200, 500].map((quickAmount) => (
              <Button
                key={quickAmount}
                title={formatCurrency(quickAmount)}
                onPress={() => setAmount(quickAmount.toString())}
                variant="outline"
                size="small"
                style={styles.quickTipButton}
              />
            ))}
          </View>
        </Card>
      </View>
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
  balanceCard: {
    backgroundColor: '#4B0082',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  feeCard: {
    backgroundColor: '#f8f9fa',
    marginVertical: 16,
  },
  feeTitle: {
    fontSize: 18,
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
  submitButton: {
    marginTop: 20,
  },
  quickTipsCard: {
    backgroundColor: '#fff',
  },
  quickTipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickTipButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickTipButton: {
    width: '48%',
    marginBottom: 8,
  },
  recipientInputContainer: {
    position: 'relative',
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  recipientName: {
    fontSize: 14,
    color: '#34c759',
    marginTop: 4,
    fontWeight: '500',
  },
  recipientError: {
    fontSize: 14,
    color: '#ff3b30',
    marginTop: 4,
    fontWeight: '500',
  },
});
