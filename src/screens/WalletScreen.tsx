import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, Alert, Share, TouchableOpacity, Clipboard, Modal, SafeAreaView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { balance, transactions, loading, refreshBalance, refreshTransactions } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [tippingLink, setTippingLink] = useState('');
  const [useUsername, setUseUsername] = useState(false);
  const [tippingModalVisible, setTippingModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionStats, setTransactionStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTips: 0,
    totalReferrals: 0,
    thisMonthDeposits: 0,
    thisMonthWithdrawals: 0,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionDetailModalVisible, setTransactionDetailModalVisible] = useState(false);
  const [allTransactionsModalVisible, setAllTransactionsModalVisible] = useState(false);
  const [allTransactionsSearch, setAllTransactionsSearch] = useState('');
  const [allTransactionsFilter, setAllTransactionsFilter] = useState<string>('all');
  const [allTransactionsData, setAllTransactionsData] = useState<any[]>([]);
  const [loadingAllTransactions, setLoadingAllTransactions] = useState(false);

  // Generate tipping link
  const generateTippingLink = () => {
    if (!user?.id) return '';

    const baseUrl = 'https://givta.app'; // Replace with your actual domain

    if (useUsername) {
      // Use username/display name
      const username = user.displayName || user.email?.split('@')[0] || user.id;
      // Clean username for URL (remove special characters, spaces)
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tippingPath = `/tip/u/${cleanUsername}`;
      return `${baseUrl}${tippingPath}`;
    } else {
      // Use user ID (more secure)
      const tippingPath = `/tip/${user.id}`;
      return `${baseUrl}${tippingPath}`;
    }
  };

  // Share tipping link
  const shareTippingLink = async () => {
    try {
      const link = generateTippingLink();
      if (!link) {
        Alert.alert('Error', 'Unable to generate tipping link');
        return;
      }

      const userName = user?.displayName || user?.email?.split('@')[0] || 'Givta User';
      const message = `🎁 Support ${userName} with a tip!\n\nSend tips easily with Givta:\n${link}\n\n#Givta #SupportCreator`;

      const result = await Share.share({
        message: message,
        url: link, // For iOS
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share tipping link');
    }
  };

  // Copy tipping link to clipboard
  const copyTippingLink = async () => {
    try {
      const link = generateTippingLink();
      if (!link) {
        Alert.alert('Error', 'Unable to generate tipping link');
        return;
      }

      await Clipboard.setString(link);
      Alert.alert('Success', 'Tipping link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  // Initialize tipping link on component mount and when preferences change
  useEffect(() => {
    const link = generateTippingLink();
    setTippingLink(link);
  }, [user, useUsername]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBalance(), refreshTransactions()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Ionicons name="arrow-down-circle" size={24} color="#34c759" />;
      case 'withdrawal':
        return <Ionicons name="arrow-up-circle" size={24} color="#ff3b30" />;
      case 'tip':
        return <Ionicons name="gift" size={24} color="#ff9500" />;
      case 'referral_bonus':
        return <Ionicons name="people" size={24} color="#4B0082" />;
      default:
        return <Ionicons name="card" size={24} color="#8e8e93" />;
    }
  };

  const handleTransactionPress = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDetailModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleTransactionPress(item)}>
      <Card style={styles.transactionCard} padding={12} margin={4}>
        <View style={styles.transactionRow}>
          <View style={styles.transactionLeft}>
            <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{item.description}</Text>
              <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              item.type === 'withdrawal' || item.type === 'tip' ? styles.negativeAmount : styles.positiveAmount
            ]}>
              {item.type === 'withdrawal' || item.type === 'tip' ? '-' : '+'}
              {formatCurrency(item.amount)}
            </Text>
            <Text style={[
              styles.transactionStatus,
              item.status === 'completed' ? styles.completedStatus :
              item.status === 'pending' ? styles.pendingStatus : styles.failedStatus
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderAllTransactionsModal = () => (
    <Modal
      visible={allTransactionsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setAllTransactionsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <TouchableOpacity
              onPress={() => setAllTransactionsModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All Transactions</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <View style={styles.modalContent}>
          {/* Search in Modal */}
          <View style={styles.modalSearchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8e8e93" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search all transactions..."
                value={allTransactionsSearch}
                onChangeText={setAllTransactionsSearch}
              />
              {allTransactionsSearch ? (
                <TouchableOpacity onPress={() => setAllTransactionsSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#8e8e93" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              {[
                { key: 'all', label: 'All', icon: 'list' },
                { key: 'deposit', label: 'Deposits', icon: 'arrow-down-circle' },
                { key: 'withdrawal', label: 'Withdrawals', icon: 'arrow-up-circle' },
                { key: 'tip', label: 'Tips', icon: 'gift' },
                { key: 'referral_bonus', label: 'Referrals', icon: 'people' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    allTransactionsFilter === filter.key && styles.filterButtonActive
                  ]}
                  onPress={() => setAllTransactionsFilter(filter.key)}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={16}
                    color={allTransactionsFilter === filter.key ? '#fff' : '#4B0082'}
                  />
                  <Text style={[
                    styles.filterText,
                    allTransactionsFilter === filter.key && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtered Transactions */}
          {loadingAllTransactions ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <FlatList
              data={allTransactionsData.filter(txn => {
                const matchesSearch = allTransactionsSearch === '' ||
                  txn.description?.toLowerCase().includes(allTransactionsSearch.toLowerCase()) ||
                  txn.type?.toLowerCase().includes(allTransactionsSearch.toLowerCase());

                const matchesFilter = allTransactionsFilter === 'all' || txn.type === allTransactionsFilter;

                return matchesSearch && matchesFilter;
              })}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleTransactionPress(item)}>
                  <Card style={styles.transactionCard} padding={12} margin={4}>
                    <View style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
                        <View style={styles.transactionDetails}>
                          <Text style={styles.transactionDescription}>{item.description}</Text>
                          <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[
                          styles.transactionAmount,
                          item.type === 'withdrawal' || item.type === 'tip' ? styles.negativeAmount : styles.positiveAmount
                        ]}>
                          {item.type === 'withdrawal' || item.type === 'tip' ? '-' : '+'}
                          {formatCurrency(item.amount)}
                        </Text>
                        <Text style={[
                          styles.transactionStatus,
                          item.status === 'completed' ? styles.completedStatus :
                          item.status === 'pending' ? styles.pendingStatus : styles.failedStatus
                        ]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Card style={styles.emptyCard} padding={32} margin={16}>
                  <Ionicons name="document-text-outline" size={48} color="#8e8e93" />
                  <Text style={styles.emptyText}>No transactions found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
                </Card>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderTransactionDetailModal = () => (
    <Modal
      visible={transactionDetailModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setTransactionDetailModalVisible(false)}
    >
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalContent}>
          {selectedTransaction && (
            <>
              <View style={styles.detailHeader}>
                <Text style={styles.detailIcon}>{getTransactionIcon(selectedTransaction.type)}</Text>
                <Text style={styles.detailTitle}>
                  {selectedTransaction.type === 'deposit' ? 'Money Deposit' :
                   selectedTransaction.type === 'withdrawal' ? 'Money Withdrawal' :
                   selectedTransaction.type === 'tip' ? 'Tip Sent' :
                   selectedTransaction.type === 'referral_bonus' ? 'Referral Bonus' :
                   'Transaction'}
                </Text>
                <TouchableOpacity
                  onPress={() => setTransactionDetailModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#8e8e93" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[
                    styles.detailValue,
                    selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'tip' ? styles.negativeAmount : styles.positiveAmount
                  ]}>
                    {selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'tip' ? '-' : '+'}
                    {formatCurrency(selectedTransaction.amount)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    selectedTransaction.status === 'completed' ? styles.completedStatus :
                    selectedTransaction.status === 'pending' ? styles.pendingStatus : styles.failedStatus
                  ]}>
                    {selectedTransaction.status?.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.createdAt).toLocaleDateString('en-NG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.id}</Text>
                </View>

                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}

                {selectedTransaction.reference && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.reference}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailActions}>
                <Button
                  title="Close"
                  onPress={() => setTransactionDetailModalVisible(false)}
                  variant="outline"
                  style={styles.detailCloseButton}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Load all transactions on component mount
  useEffect(() => {
    loadAllTransactions();
  }, []);

  const loadAllTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await apiService.getTransactions(50); // Get last 50 transactions
      if (response.success && response.data) {
        const transactions = response.data.transactions || [];
        setAllTransactions(transactions);
        calculateStats(transactions);
      } else {
        // Set empty arrays on error to prevent filter/reduce errors
        setAllTransactions([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Set empty arrays on error to prevent filter/reduce errors
      setAllTransactions([]);
      calculateStats([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const calculateStats = (txns: any[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = txns.reduce((acc, txn) => {
      const amount = txn.amount || 0;
      const txnDate = new Date(txn.createdAt);

      switch (txn.type) {
        case 'deposit':
          acc.totalDeposits += amount;
          if (txnDate >= thisMonth) acc.thisMonthDeposits += amount;
          break;
        case 'withdrawal':
          acc.totalWithdrawals += amount;
          if (txnDate >= thisMonth) acc.thisMonthWithdrawals += amount;
          break;
        case 'tip':
          acc.totalTips += amount;
          break;
        case 'referral_bonus':
          acc.totalReferrals += amount;
          break;
      }
      return acc;
    }, {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTips: 0,
      totalReferrals: 0,
      thisMonthDeposits: 0,
      thisMonthWithdrawals: 0,
    });

    setTransactionStats(stats);
  };

  // Filter and search transactions
  const filteredTransactions = allTransactions.filter(txn => {
    const matchesSearch = searchQuery === '' ||
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || txn.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const quickActions = [
    {
      id: 'deposit',
      title: 'Deposit',
      subtitle: 'Add money to wallet',
      icon: 'add-circle',
      color: '#34c759',
      action: () => (navigation as any).navigate('Payment', { paymentType: 'deposit' })
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      subtitle: 'Cash out earnings',
      icon: 'remove-circle',
      color: '#ff3b30',
      action: () => (navigation as any).navigate('Payment', { paymentType: 'withdraw' })
    },
    {
      id: 'tip',
      title: 'Send Tip',
      subtitle: 'Tip someone',
      icon: 'gift',
      color: '#ff9500',
      action: () => (navigation as any).navigate('Tip')
    },
    {
      id: 'share',
      title: 'Share Link',
      subtitle: 'Receive tips',
      icon: 'share-social',
      color: '#4B0082',
      action: () => setTippingModalVisible(true)
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Balance Card */}
        <Card style={styles.balanceCard} padding={24} margin={16}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color="#fff" />
              <Text style={styles.statText}>
                +{formatCurrency(transactionStats.thisMonthDeposits)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-down" size={16} color="#fff" />
              <Text style={styles.statText}>
                -{formatCurrency(transactionStats.thisMonthWithdrawals)}
              </Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={action.action}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Transaction Summary */}
        <Card style={styles.summaryCard} padding={20} margin={16}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down-circle" size={20} color="#34c759" />
              <Text style={styles.summaryValue}>{formatCurrency(transactionStats.totalDeposits)}</Text>
              <Text style={styles.summaryLabel}>Total Deposits</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up-circle" size={20} color="#ff3b30" />
              <Text style={styles.summaryValue}>{formatCurrency(transactionStats.totalWithdrawals)}</Text>
              <Text style={styles.summaryLabel}>Total Withdrawals</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="gift" size={20} color="#ff9500" />
              <Text style={styles.summaryValue}>{formatCurrency(transactionStats.totalTips)}</Text>
              <Text style={styles.summaryLabel}>Tips Sent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={20} color="#4B0082" />
              <Text style={styles.summaryValue}>{formatCurrency(transactionStats.totalReferrals)}</Text>
              <Text style={styles.summaryLabel}>Referral Earnings</Text>
            </View>
          </View>
        </Card>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8e8e93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8e8e93" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {[
              { key: 'all', label: 'All', icon: 'list' },
              { key: 'deposit', label: 'Deposits', icon: 'arrow-down-circle' },
              { key: 'withdrawal', label: 'Withdrawals', icon: 'arrow-up-circle' },
              { key: 'tip', label: 'Tips', icon: 'gift' },
              { key: 'referral_bonus', label: 'Referrals', icon: 'people' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterType === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(filter.key)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={filterType === filter.key ? '#fff' : '#4B0082'}
                />
                <Text style={[
                  styles.filterText,
                  filterType === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>
              Recent Transactions ({filteredTransactions.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAllTransactionsData(allTransactions);
                setAllTransactionsModalVisible(true);
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions.slice(0, 20)}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Card style={styles.emptyCard} padding={32} margin={16}>
              <Ionicons name="document-text-outline" size={48} color="#8e8e93" />
              <Text style={styles.emptyText}>
                {searchQuery || filterType !== 'all' ? 'No matching transactions' : 'No transactions yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Your transaction history will appear here'
                }
              </Text>
            </Card>
          )}
        </View>
        </ScrollView>
      </View>

      {/* Transaction Detail Modal */}
      {renderTransactionDetailModal()}

      {/* All Transactions Modal */}
      {renderAllTransactionsModal()}

      {/* Tipping Link Modal */}
      <Modal
        visible={tippingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTippingModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Share Your Tipping Link</Text>
            <Text style={styles.modalSubtitle}>
              Share this link to receive tips from anyone, anywhere!
            </Text>
          </View>

          <View style={styles.modalContent}>
            {/* Link Type Selector */}
            <View style={styles.linkTypeContainer}>
              <Text style={styles.linkTypeLabel}>Link Type:</Text>
              <View style={styles.linkTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.linkTypeButton,
                    !useUsername && styles.linkTypeButtonActive
                  ]}
                  onPress={() => setUseUsername(false)}
                >
                  <View style={styles.linkTypeButtonContent}>
                    <Ionicons
                      name="shield-checkmark"
                      size={16}
                      color={!useUsername ? '#fff' : '#4B0082'}
                    />
                    <Text style={[
                      styles.linkTypeButtonText,
                      !useUsername && styles.linkTypeButtonTextActive
                    ]}>
                      Secure ID
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.linkTypeButton,
                    useUsername && styles.linkTypeButtonActive
                  ]}
                  onPress={() => setUseUsername(true)}
                >
                  <View style={styles.linkTypeButtonContent}>
                    <Ionicons
                      name="person"
                      size={16}
                      color={useUsername ? '#fff' : '#4B0082'}
                    />
                    <Text style={[
                      styles.linkTypeButtonText,
                      useUsername && styles.linkTypeButtonTextActive
                    ]}>
                      Username
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tipping Link Display */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                {tippingLink || 'Generating link...'}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyTippingLink}
              >
                <Ionicons name="copy-outline" size={18} color="#4B0082" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.tippingActions}>
              <Button
                title="Share Link"
                onPress={shareTippingLink}
                style={styles.shareButton}
                size="small"
              />
              <Button
                title="Copy Link"
                onPress={copyTippingLink}
                variant="outline"
                style={styles.copyLinkButton}
                size="small"
              />
            </View>

            {/* Usage Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How it works:</Text>
              <Text style={styles.instructionsText}>
                • Share your link on social media, websites, or messaging apps{'\n'}
                • Anyone can click the link to send you tips{'\n'}
                • Works on any device or platform{'\n'}
                • No app installation required for tippers
              </Text>
            </View>

            {/* Close Button */}
            <View style={styles.modalCloseContainer}>
              <Button
                title="Close"
                onPress={() => setTippingModalVisible(false)}
                variant="outline"
                style={styles.modalCloseButton}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#9318ebff',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
    marginTop: 8,
  },
  transactionCard: {
    marginVertical: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#8e8e93',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#34c759',
  },
  negativeAmount: {
    color: '#ff3b30',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  completedStatus: {
    color: '#34c759',
  },
  pendingStatus: {
    color: '#ff9500',
  },
  failedStatus: {
    color: '#ff3b30',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8e8e93',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  tippingCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4B0082',
  },
  tippingDescription: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 16,
    lineHeight: 22,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#4B0082',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  copyIcon: {
    fontSize: 18,
  },
  tippingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  copyLinkButton: {
    flex: 1,
    borderColor: '#4B0082',
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  linkTypeContainer: {
    marginBottom: 16,
  },
  linkTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  linkTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  linkTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  linkTypeButtonActive: {
    borderColor: '#4B0082',
    backgroundColor: '#4B0082',
  },
  linkTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
  },
  linkTypeButtonTextActive: {
    color: '#fff',
  },
  linkTypeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tippingButtonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#4B0082',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tippingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#a466eaff',
  },
  tippingButtonIcon: {
    fontSize: 28,
    marginRight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tippingButtonContent: {
    flex: 1,
  },
  tippingButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffffff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tippingButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.97)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tippingButtonArrow: {
    fontSize: 24,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#4B0082',
    padding: 20,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 22,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCloseContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  modalCloseButton: {
    borderColor: '#4B0082',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
    color: '#ffffffff',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1c1c1e',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  filterButtonActive: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B0082',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#fff',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 16,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  detailBody: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '600',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  detailCloseButton: {
    minWidth: 120,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  },
});
