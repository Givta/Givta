import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ActivityIndicator, FlatList, Modal, SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CreatorGoalDisplay } from '../components/CreatorGoalDisplay';
import { apiService } from '../services/api';

export const TipScreen: React.FC = () => {
  const { balance, refreshBalance } = useWallet();
  const { user } = useAuth();
  const route = useRoute();
  const [recipientId, setRecipientId] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValidated, setRecipientValidated] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentTips, setRecentTips] = useState<any[]>([]);
  const [autoFilledFromGoal, setAutoFilledFromGoal] = useState(false);
  const [recentBeneficiariesModalVisible, setRecentBeneficiariesModalVisible] = useState(false);
  const [tipsLoadingError, setTipsLoadingError] = useState('');

  const tipAmount = parseFloat(amount) || 0;
  const platformFee = tipAmount * 0.02; // 2% platform fee
  const totalAmount = tipAmount + platformFee;

  // Search users when recipient ID changes
  React.useEffect(() => {
    const searchUsers = async () => {
      const trimmedRecipientId = recipientId.trim();

      if (!trimmedRecipientId) {
        setSearchResults([]);
        setShowSearchResults(false);
        setRecipientValidated(false);
        setRecipientName('');
        setRecipientUserId('');
        return;
      }

      if (trimmedRecipientId.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      console.log('🔍 Searching users for:', trimmedRecipientId);
      setIsValidatingRecipient(true);

      try {
        const response = await apiService.searchUsersForTipping(trimmedRecipientId);
        console.log('🔍 Search API response:', {
          success: response.success,
          error: response.error,
          dataLength: response.data?.length || 0,
        });

        if (response.success && response.data && response.data.length > 0) {
          console.log('📋 Found search results:', response.data);
          setSearchResults(response.data);
          setShowSearchResults(true);
        } else {
          console.log('❌ No search results found');
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error('❌ Search error occurred:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsValidatingRecipient(false);
      }
    };

    // Shorter debounce for better responsiveness
    const debounceTimer = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounceTimer);
  }, [recipientId]);

  // Load recent tips on component mount
  React.useEffect(() => {
    loadRecentTips();
  }, []);

  // Note: Creator Goals Auto-fill functionality has been removed.
  // Users now manually enter recipient information for full control.

  const loadRecentTips = async () => {
    try {
      const response = await apiService.getTipsSent();
      if (response.success && response.data) {
        // Check if tips exists and is an array before slicing
        if (Array.isArray(response.data.tips)) {
          setRecentTips(response.data.tips.slice(0, 5)); // Show last 5 tips
          setTipsLoadingError(''); // Clear any previous error
        } else {
          console.warn('Tips data is not an array:', response.data.tips);
          setRecentTips([]);
        }
      }
    } catch (error) {
      console.error('Error loading recent tips:', error);
      setRecentTips([]);
    }
  };

  const selectRecipient = (user: any) => {
    console.log('🤑 Selecting recipient:', { user });

    setRecipientId(user.username || user.phoneNumber || user.email || '');
    setRecipientUserId(user.id || user.username); // Fallback: use username if ID is empty
    setRecipientName(user.displayName || user.username);
    setRecipientValidated(true);
    setShowSearchResults(false);
    setSearchResults([]);

    console.log('✅ Recipient selected:', {
      recipientId,
      recipientUserId: user.id || user.username, // Fallback: use username
      recipientName: user.displayName || user.username
    });
  };

  const handleTip = async () => {
    if (!recipientId.trim()) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    if (!recipientValidated) {
      Alert.alert('Error', 'Please select a valid recipient from the search results');
      return;
    }

    if (!recipientUserId || recipientUserId.trim() === '') {
      Alert.alert('Error', 'Invalid recipient selected. Please try searching and selecting again.');
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

      console.log('🎯 Sending tip:', {
        recipientUserId,
        recipientName,
        tipAmount,
        platformFee,
        description: description.trim(),
        user: user?.id
      });

      const response = await apiService.sendTip(recipientUserId, tipAmount, description.trim());

      console.log('🎯 Tip API response:', response);

      if (response.success) {
        Alert.alert(
          'Success! 🎉',
          `Tip of ${formatCurrency(tipAmount)} sent to ${recipientName} successfully!\n\nPlatform fee: ${formatCurrency(platformFee)}`,
          [
            {
              text: 'Send Another',
              onPress: () => {
                setRecipientId('');
                setRecipientUserId('');
                setRecipientName('');
                setAmount('');
                setDescription('');
                setRecipientValidated(false);
                setSearchResults([]);
                setShowSearchResults(false);
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
        console.error('❌ Tip failed with error:', response.error);
        Alert.alert('Error', response.error || 'Failed to send tip. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Tip error occurred:', error);
      const errorMessage = error?.message || 'Failed to send tip. Please try again.';
      Alert.alert('Error', errorMessage);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'username':
        return 'person';
      case 'phone':
        return 'call';
      case 'referral':
        return 'gift';
      default:
        return 'person';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'username':
        return 'Username';
      case 'phone':
        return 'Phone';
      case 'referral':
        return 'Referral Code';
      default:
        return 'User';
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => selectRecipient(item)}
    >
      <View style={styles.searchResultLeft}>
        <Ionicons name={getTypeIcon(item.type)} size={20} color="#4B0082" />
        <View style={styles.searchResultText}>
          <Text style={styles.searchResultName}>{item.displayName}</Text>
          <Text style={styles.searchResultDetail}>
            {item.username && `@${item.username}`}
            {item.phoneNumber && ` • ${item.phoneNumber}`}
            {item.email && ` • ${item.email}`}
          </Text>
        </View>
      </View>
      <View style={styles.searchResultRight}>
        <Text style={styles.searchResultType}>{getTypeLabel(item.type)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { key: 'balance' },
          { key: 'form' },
          { key: 'quickTips' }
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          if (item.key === 'balance') {
            return (
              <Card style={styles.balanceCard} padding={16} margin={16}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              </Card>
            );
          }

          if (item.key === 'form') {
            return (
              <Card style={styles.formCard} padding={20} margin={16}>
                <Text style={styles.formTitle}>Send a Tip</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.recipientHeader}>
                    <Text style={styles.inputLabel}>Search Recipient</Text>
                    {recentTips.length > 0 && (
                      <TouchableOpacity
                        style={styles.recentBeneficiariesButton}
                        onPress={() => setRecentBeneficiariesModalVisible(true)}
                      >
                        <Ionicons name="time-outline" size={16} color="#4B0082" />
                        <Text style={styles.recentBeneficiariesButtonText}>Recent ({recentTips.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.recipientInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter username or phone number (e.g., +2348012345678, @johndoe)"
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

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                      <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        renderItem={renderSearchResult}
                        style={styles.searchResultsList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        scrollEnabled={false}
                      />
                    </View>
                  )}

                  {recipientValidated && recipientName && (
                    <Text style={styles.recipientName}>
                      <Ionicons name="person" size={14} color="#4B0082" /> {recipientName}
                    </Text>
                  )}
                  {recipientId && !isValidatingRecipient && !recipientValidated && searchResults.length === 0 && (
                    <Text style={styles.recipientError}>
                      <Ionicons name="alert-circle" size={14} color="#ff3b30" /> No recipients found
                    </Text>
                  )}

                  {/* Creator Goals Display */}
                  {recipientValidated && recipientUserId && (
                    <CreatorGoalDisplay
                      creatorId={recipientUserId}
                      creatorUsername={recipientName}
                      onTipPress={() => {
                        // Auto-navigate to the tip amount section
                        setAmount('100'); // Default to ₦100
                      }}
                      onGoalPress={(goal) => {
                        Alert.alert(
                          goal.emoji + ' ' + goal.title,
                          `${goal.description}\n\nCurrent Progress: ₦${goal.currentAmount.toLocaleString()} / ₦${goal.goalAmount.toLocaleString()} (${goal.progressPercentage}% complete)\n\nKeep supporting! 💰`
                        );
                      }}
                      compact={true}
                    />
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
            );
          }

          if (item.key === 'quickTips') {
            return (
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
            );
          }

          return null;
        }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Recent Beneficiaries Modal */}
      <Modal
        visible={recentBeneficiariesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRecentBeneficiariesModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity
                onPress={() => setRecentBeneficiariesModalVisible(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Recent Beneficiaries</Text>
              <View style={styles.placeholder} />
            </View>
          </View>

          <View style={styles.modalContent}>
            {recentTips.length > 0 ? (
              <FlatList
                data={recentTips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.beneficiaryItem}
                    onPress={() => {
                      // Pre-select this beneficiary
                      selectRecipient({
                        id: item.recipientId,
                        username: item.recipientUsername,
                        displayName: item.recipientName,
                        phoneNumber: item.recipientPhone,
                        email: item.recipientEmail,
                        type: item.recipientType || 'username'
                      });
                      setRecentBeneficiariesModalVisible(false);
                    }}
                  >
                    <View style={styles.beneficiaryLeft}>
                      <Ionicons name="person-circle" size={40} color="#4B0082" />
                      <View style={styles.beneficiaryText}>
                        <Text style={styles.beneficiaryName}>{item.recipientName}</Text>
                        <Text style={styles.beneficiaryDetail}>
                          {item.recipientUsername && `@${item.recipientUsername}`}
                          {item.recipientPhone && ` • ${item.recipientPhone}`}
                        </Text>
                        <Text style={styles.lastTipAmount}>
                          Last tip: {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.beneficiaryRight}>
                      <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <Card style={styles.emptyCard} padding={32} margin={16}>
                    <Ionicons name="people-outline" size={48} color="#8e8e93" />
                    <Text style={styles.emptyText}>No recent beneficiaries</Text>
                    <Text style={styles.emptySubtext}>
                      Start tipping creators to see them here for quick selection
                    </Text>
                  </Card>
                }
              />
            ) : (
              <Card style={styles.emptyCard} padding={32} margin={16}>
                <Ionicons name="people-outline" size={48} color="#8e8e93" />
                <Text style={styles.emptyText}>No recent beneficiaries</Text>
                <Text style={styles.emptySubtext}>
                  Start tipping creators to see them here for quick selection
                </Text>
              </Card>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
    paddingVertical: 15,
    fontSize: 12,
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
  searchResultsContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultText: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  searchResultDetail: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 2,
  },
  searchResultRight: {
    alignItems: 'center',
  },
  searchResultType: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '500',
    marginBottom: 2,
  },

  // Error Modal Styles
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 12,
    textAlign: 'center',
  },
  errorBody: {
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSuggestion: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorRetryButton: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  errorCloseButton: {
    flex: 1,
    borderColor: '#4B0082',
  },

  // Recent Beneficiaries Styles
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentBeneficiariesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(75, 0, 130, 0.1)',
  },
  recentBeneficiariesButtonText: {
    fontSize: 14,
    color: '#4B0082',
    fontWeight: '500',
    marginLeft: 4,
  },

  // Modal Shared Styles (from WalletScreen)
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  modalHeader: {
    backgroundColor: '#4B0082',
    padding: 20,
    paddingTop: 60,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },

  // Beneficiary Item Styles
  beneficiaryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beneficiaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  beneficiaryText: {
    flex: 1,
    marginLeft: 12,
  },
  beneficiaryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  beneficiaryDetail: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
  lastTipAmount: {
    fontSize: 14,
    color: '#34c759',
    fontWeight: '500',
  },
  beneficiaryRight: {
    justifyContent: 'center',
  },

  // Shared Empty State Styles
  separator: {
    height: 8,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8e8e93',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
