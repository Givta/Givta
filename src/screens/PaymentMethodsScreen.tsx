import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const PaymentMethodsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Mock payment methods data
  const [paymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      accountName: 'John Doe',
      accountNumber: '****1234',
      bankName: 'First Bank',
      isDefault: false,
    },
  ]);

  const handleAddCard = () => {
    Alert.alert('Add Card', 'Card addition feature coming soon!');
  };

  const handleAddBankAccount = () => {
    Alert.alert('Add Bank Account', 'Bank account addition feature coming soon!');
  };

  const handleSetDefault = (id: string) => {
    Alert.alert('Set as Default', 'Default payment method updated successfully');
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Payment method deleted successfully')
        }
      ]
    );
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      default: return '💳';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>Manage your saved payment options</Text>
        </View>

        {/* Add New Payment Method */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Add New Payment Method</Text>

          <View style={styles.addButtons}>
            <Button
              title="Add Debit/Credit Card"
              onPress={handleAddCard}
              variant="secondary"
              size="small"
              style={styles.addButton}
            />

            <Button
              title="Add Bank Account"
              onPress={handleAddBankAccount}
              variant="secondary"
              size="small"
              style={styles.addButton}
            />
          </View>
        </Card>

        {/* Saved Payment Methods */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Saved Payment Methods</Text>

          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptyText}>
                Add a payment method to make transactions faster and easier
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentMethod}>
                <View style={styles.methodInfo}>
                  {method.type === 'card' ? (
                    <>
                      <Text style={styles.methodIcon}>
                        {getCardIcon(method.brand || 'visa')}
                      </Text>
                      <View style={styles.methodDetails}>
                        <Text style={styles.methodTitle}>
                          {method.brand || 'Card'} •••• {method.last4}
                        </Text>
                        <Text style={styles.methodSubtitle}>
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.methodIcon}>🏦</Text>
                      <View style={styles.methodDetails}>
                        <Text style={styles.methodTitle}>
                          {method.bankName}
                        </Text>
                        <Text style={styles.methodSubtitle}>
                          {method.accountName} •••• {method.accountNumber || '****'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.methodActions}>
                  {method.isDefault && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}

                  <View style={styles.actionButtons}>
                    {!method.isDefault && (
                      <Button
                        title="Set Default"
                        onPress={() => handleSetDefault(method.id)}
                        variant="outline"
                        size="small"
                        style={styles.actionButton}
                      />
                    )}

                    <Button
                      title="Delete"
                      onPress={() => handleDelete(method.id)}
                      variant="outline"
                      size="small"
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Security Info */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.infoTitle}>🔒 Security Information</Text>
          <Text style={styles.infoText}>
            • Your payment information is encrypted and secure{'\n'}
            • We never store your full card or bank details{'\n'}
            • All transactions are protected by bank-level security{'\n'}
            • You can remove payment methods anytime
          </Text>
        </Card>

        {/* Support */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            Need help with payment methods?
          </Text>
          <Button
            title="Contact Support"
            onPress={() => Alert.alert('Support', 'Contact our support team at support@givta.com')}
            variant="outline"
            size="small"
          />
        </View>
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
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  addButtons: {
    gap: 12,
  },
  addButton: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  methodActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34c759',
    backgroundColor: '#e8f8e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  deleteButton: {
    borderColor: '#ff3b30',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 22,
  },
  supportContainer: {
    padding: 16,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
    textAlign: 'center',
  },
});
