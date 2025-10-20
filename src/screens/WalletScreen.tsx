import React, { useEffect, useState, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, Alert, Share, TouchableOpacity, Clipboard, Modal, SafeAreaView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

import { transactionCollection } from '../collections/transactions';
import { userCollection } from '../collections/users';
import { notificationCollection } from '../collections/notifications';
import { applicationNotificationsCollection, ApplicationNotification } from '../collections/applicationNotifications';
import { config } from '../config';

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { balance, transactions, loading, refreshBalance, refreshTransactions } = useWallet();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const [refreshing, setRefreshing] = useState(false);
  const [tippingLink, setTippingLink] = useState('');
  const [useUsername, setUseUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [tippingModalVisible, setTippingModalVisible] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deviceRegistered, setDeviceRegistered] = useState<string | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
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

  // Application notifications state
  const [applicationNotifications, setApplicationNotifications] = useState<ApplicationNotification[]>([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const notificationScrollRef = useRef<ScrollView>(null);
  const [earnMoreModalVisible, setEarnMoreModalVisible] = useState(false);

  // Generate permanent username-based tipping link
  const generateTippingLink = async () => {
    if (!user?.id) return '';

    try {
      // Use username as permanent, stable identifier
      const username = user.username || user.email?.split('@')[0] || user.id;

      // Return the permanent username-based tip link
      return `https://givta.app/tip/${username}`;
    } catch (error) {
      console.error('Error generating tipping link:', error);
      // Ultimate fallback
      return `https://givta.app/tip/${user.id}`;
    }
  };

  // Share tipping link
  const shareTippingLink = async () => {
    try {
      // For username sharing, only block if we explicitly know the username is taken
      // Allow sharing if check is pending, failed, or username is available
      if (useUsername && usernameAvailable === false) {
        Alert.alert('Username Taken', 'This username is already taken. Please choose a different username or use Secure ID instead.');
        return;
      }

      const link = await generateTippingLink();
      if (!link) {
        Alert.alert('Error', 'Unable to generate tipping link');
        return;
      }

      const userName = user?.username || user?.email?.split('@')[0] || 'Givta User';
      const message = `🎁 Support ${userName} with a small tip 💰— every naira counts!\n\nSend tips easily with Givta:\n${link}\n\n#Givta #SupportCreator \nReceive Tips from any platform, register your account https://givta.app/register`;

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
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share tipping link. Please try again.');
    }
  };

  // Copy tipping link to clipboard
  const copyTippingLink = async () => {
    try {
      // For username copying, only block if we explicitly know the username is taken
      // Allow copying if check is pending, failed, or username is available
      if (useUsername && usernameAvailable === false) {
        Alert.alert('Username Taken', 'This username is already taken. Please choose a different username or use Secure ID instead.');
        return;
      }

      const link = await generateTippingLink();
      if (!link) {
        Alert.alert('Error', 'Unable to generate tipping link');
        return;
      }

      await Clipboard.setString(link);
      Alert.alert('Success', 'Tipping link copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  // Check username availability when useUsername changes
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (!useUsername || !user) {
        setUsernameAvailable(null);
        return;
      }

      const username = user.username || user.email?.split('@')[0] || user.id;
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      if (!cleanUsername) {
        setUsernameAvailable(null);
        return;
      }

      // If the username matches the current user's username, allow it
      if (user.username && cleanUsername === user.username.toLowerCase()) {
        console.log('Username matches current user, allowing it for tipping link');
        setUsernameAvailable(true);
        return;
      }

      try {
        setCheckingUsername(true);

        console.log('Checking username availability for tipping link:', cleanUsername);
        console.log('API URL:', `${config.api.baseURL}/auth/check-username`);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('Username check request timed out after 10 seconds');
          controller.abort();
        }, 10000); // 10 second timeout

        const response = await fetch(`${config.api.baseURL}/auth/check-username`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: cleanUsername }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Username check response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Username check response data:', data);

        if (data.success) {
          setUsernameAvailable(data.data.available);
          console.log('Username availability result:', data.data.available);
        } else {
          console.error('Username check failed:', data.message);
          setUsernameAvailable(null);
        }
      } catch (error: any) {
        console.error('Error checking username availability:', error);
        console.error('Error details:', error.message);
        setUsernameAvailable(null);
        if (error.name === 'AbortError') {
          console.error('Username check request timed out after 10 seconds');
          Alert.alert('Connection Error', 'Unable to check username availability. Please check your internet connection and try again.');
        } else {
          console.error('Network or server error occurred');
        }
      } finally {
        setCheckingUsername(false);
      }
    };

    checkUsernameAvailability();
  }, [useUsername, user]);

  // Initialize tipping link on component mount and when preferences change
  useEffect(() => {
    const initializeLink = async () => {
      const link = await generateTippingLink();
      setTippingLink(link);
    };
    initializeLink();
  }, [user, useUsername, usernameAvailable]);

  // Load unread notifications on component mount
  useEffect(() => {
    loadUnreadNotificationsCount();
  }, [user]);

  useEffect(() => {
    const checkDeviceRegistered = async () => {
      try {
        const v = await AsyncStorage.getItem('deviceRegistered');
        setDeviceRegistered(v);
      } catch (e) {
        setDeviceRegistered(null);
      }
    };
    checkDeviceRegistered();
  }, []);

  const loadUnreadNotificationsCount = async () => {
    if (!user?.id) return;

    try {
      setLoadingNotifications(true);
      const count = await notificationCollection.getUnreadCount(user.id);
      setUnreadNotifications(count);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const navigateToNotifications = () => {
    (navigation as any).navigate('Notifications');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnreadNotificationsCount();
    await loadApplicationNotifications(); // Refresh notifications from admin dashboard
    await Promise.all([refreshBalance(), refreshTransactions()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';

      let dateObj;
      if (date.toDate && typeof date.toDate === 'function') {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (typeof date === 'object' && date.seconds) {
        // Unix timestamp in seconds
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = date instanceof Date ? date : new Date(date);
      }

      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'N/A';
    }
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
              <Text style={styles.transactionDescription}>{item.resolvedDescription || item.description}</Text>
              <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              item.type === 'withdrawal' || item.type === 'tip_sent' ? styles.negativeAmount :
              item.type === 'tip_received' || item.type === 'deposit' || item.type === 'referral_bonus' ? styles.positiveAmount : styles.positiveAmount
            ]}>
              {item.type === 'withdrawal' || item.type === 'tip_sent' ? '-' :
               item.type === 'deposit' || item.type === 'tip_received' || item.type === 'referral_bonus' ? '+' : '+'}
              {formatCurrency(Math.abs(item.amount))}
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
                          <Text style={styles.transactionDescription}>{item.resolvedDescription || item.description}</Text>
                          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[
                          styles.transactionAmount,
                          item.type === 'withdrawal' || item.type === 'tip_sent' ? styles.negativeAmount : styles.positiveAmount
                        ]}>
                          {item.type === 'withdrawal' || item.type === 'tip_sent' ? '-' : '+'}
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
                    {formatDate(selectedTransaction.createdAt)}
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

  // Error state for modals
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load application notifications on component mount
  useEffect(() => {
    loadApplicationNotifications();
  }, [user]);

  // Auto-scroll notifications
  useEffect(() => {
    if (applicationNotifications.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNotificationIndex((prevIndex) =>
        (prevIndex + 1) % applicationNotifications.length
      );
    }, 5000); // Change notification every 5 seconds

    return () => clearInterval(interval);
  }, [applicationNotifications.length]);

  // Scroll to current notification
  useEffect(() => {
    if (notificationScrollRef.current && applicationNotifications.length > 1) {
      notificationScrollRef.current.scrollTo({
        x: currentNotificationIndex * 300, // Approximate width of each notification
        animated: true,
      });
    }
  }, [currentNotificationIndex, applicationNotifications.length]);

const loadAllTransactions = async () => {
    if (!user?.id) return;

    try {
      setLoadingTransactions(true);
      const result = await transactionCollection.getByUserId(user.id, 50);

      // Check if result.transactions exists and is an array
      if (!result || !Array.isArray(result.transactions)) {
        console.warn('Invalid transaction data structure:', result);
        // Show error modal instead of breaking
        setErrorTitle('Transaction Loading Error');
        setErrorMessage('Error loading recent tips: [TypeError: Cannot read property \'slice\' of undefined]');
        setErrorModalVisible(true);
        setAllTransactions([]);
        calculateStats([]);
        return;
      }

      // Resolve usernames for tip transactions
      const transactionsWithResolvedDescriptions = await Promise.all(
        result.transactions.map(async (txn: any) => {
          if (txn.type === 'tip_sent' && txn.recipientId) {
            try {
              const recipientUser = await userCollection.getById(txn.recipientId);
              txn.resolvedDescription = recipientUser ? `Tip sent to @${recipientUser.username || recipientUser.email?.split('@')[0] || txn.recipientId}` : txn.description;
            } catch (e) {
              txn.resolvedDescription = txn.description;
            }
          } else if (txn.type === 'tip_received' && txn.senderId) {
            try {
              const senderUser = await userCollection.getById(txn.senderId);
              txn.resolvedDescription = senderUser ? `Tip received from @${senderUser.username || senderUser.email?.split('@')[0] || txn.senderId}` : txn.description;
            } catch (e) {
              txn.resolvedDescription = txn.description;
            }
          } else {
            txn.resolvedDescription = txn.description;
          }
          return txn;
        })
      );

      setAllTransactions(transactionsWithResolvedDescriptions);
      calculateStats(result.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Show error modal for better user experience
      setErrorTitle('Transaction Loading Error');
      setErrorMessage('Error loading recent tips: [TypeError: Cannot read property \'slice\' of undefined]');
      setErrorModalVisible(true);
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
      const amount = Math.abs(txn.amount || 0); // Use absolute value for totals
      const txnDate = txn.createdAt ? new Date(txn.createdAt) : new Date();

      switch (txn.type) {
        case 'deposit':
          acc.totalDeposits += amount;
          if (txnDate >= thisMonth) acc.thisMonthDeposits += amount;
          break;
        case 'withdrawal':
          acc.totalWithdrawals += amount; // Use absolute value of negative amount
          if (txnDate >= thisMonth) acc.thisMonthWithdrawals += amount;
          break;
        case 'tip_received':
        case 'tip_sent':
          // Only count tips sent for the summary
          if (txn.type === 'tip_sent') {
            acc.totalTips += amount;
          }
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

  const loadApplicationNotifications = async () => {
    if (!user?.id) return;

    try {
      // Debug: Check what's actually in the database
      console.log('=== DEBUG: Checking Firestore collection ===');
      const allRawDocs = await applicationNotificationsCollection.getAllRaw();
      console.log('Raw documents in collection:', allRawDocs);

      // For now, show all notifications to all users
      // TODO: Implement user verification status check when available
      const userTarget = 'all';

      const notifications = await applicationNotificationsCollection.getAllActive(userTarget);
      console.log('Loaded application notifications:', notifications.length, notifications);
      setApplicationNotifications(notifications);
    } catch (error) {
      console.error('Error loading application notifications:', error);
    }
  };



  const renderApplicationNotifications = () => {
    console.log('Rendering notifications:', applicationNotifications.length, applicationNotifications);

    if (applicationNotifications.length === 0) {
      console.log('No notifications to render');
      return null;
    }

    if (applicationNotifications.length === 1) {
      // Single notification - no scrolling needed
      const notification = applicationNotifications[0];
      return (
        <Card style={styles.notificationCard} padding={16} margin={8}>
          <View style={styles.notificationContent}>
            <View style={styles.notificationIcon}>
              {notification.type === 'promo' && <Ionicons name="gift" size={20} color="#ff9500" />}
              {notification.type === 'warning' && <Ionicons name="warning" size={20} color="#ff3b30" />}
              {notification.type === 'success' && <Ionicons name="checkmark-circle" size={20} color="#34c759" />}
              {notification.type === 'info' && <Ionicons name="information-circle" size={20} color="#007aff" />}
              {notification.type === 'system' && <Ionicons name="settings" size={20} color="#8e8e93" />}
            </View>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          </View>
        </Card>
      );
    }

    // Multiple notifications - horizontal scrolling
    return (
      <Card style={styles.notificationCard} padding={16} margin={8}>
        <View style={styles.notificationHeader}>
          <Ionicons name="megaphone" size={20} color="#4B0082" />
          <Text style={styles.notificationHeaderText}>Announcements</Text>
        </View>
        <ScrollView
          ref={notificationScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.notificationScrollView}
          contentContainerStyle={styles.notificationScrollContent}
        >
          {applicationNotifications.map((notification, index) => (
            <View key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationContent}>
                <View style={styles.notificationIcon}>
                  {notification.type === 'promo' && <Ionicons name="gift" size={20} color="#ff9500" />}
                  {notification.type === 'warning' && <Ionicons name="warning" size={20} color="#ff3b30" />}
                  {notification.type === 'success' && <Ionicons name="checkmark-circle" size={20} color="#34c759" />}
                  {notification.type === 'info' && <Ionicons name="information-circle" size={20} color="#007aff" />}
                  {notification.type === 'system' && <Ionicons name="settings" size={20} color="#8e8e93" />}
                </View>
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.notificationIndicators}>
          {applicationNotifications.map((_, index) => (
            <View
              key={index}
              style={[
                styles.notificationIndicator,
                index === currentNotificationIndex && styles.notificationIndicatorActive
              ]}
            />
          ))}
        </View>
      </Card>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>Givta</Text>
          </View>
          <TouchableOpacity
            style={styles.earnMoreButton}
            onPress={() => setEarnMoreModalVisible(true)}
          >
            <Ionicons name="bulb-outline" size={20} color="#fff" />
            <Text style={styles.earnMoreButtonText}>Earn More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={navigateToNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
            {/* Device registration indicator (small) */}
            <View style={styles.deviceIndicator}>
              <View style={[styles.deviceDot, deviceRegistered === 'true' ? styles.deviceDotOk : styles.deviceDotFail]} />
              <Text style={styles.deviceIndicatorText}>{deviceRegistered === 'true' ? 'push on' : deviceRegistered === 'false' ? 'push off' : 'push ?'}</Text>
            </View>
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Balance Card */}
        <Card style={styles.balanceCard} padding={24} margin={8}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Balance only - Quick Stats removed */}
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

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
        <Card style={styles.summaryCard} padding={20} margin={8}>
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

        {/* Application Notifications */}
        {renderApplicationNotifications()}

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>
              Recent Transactions
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

          {allTransactions && allTransactions.length > 0 ? (
            <FlatList
              data={allTransactions.slice(0, 2)}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Card style={styles.emptyCard} padding={32} margin={16}>
              <Ionicons name="document-text-outline" size={48} color="#8e8e93" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Your transaction history will appear here
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
            {/* Username Display */}
            <View style={styles.usernameContainer}>
              <Text style={styles.usernameLabel}>Your Username:</Text>
              <View style={styles.usernameDisplay}>
                <Text style={styles.usernameText}>
                  {user?.username || user?.email?.split('@')[0] || 'No username set'}
                </Text>
              </View>
              <Text style={styles.usernameInfo}>
                This is your unique identifier in Givta. Use it to personalize your profile and make it easier for fans to find you.
              </Text>
            </View>

            {/* Link Type Info */}
            <View style={styles.linkTypeContainer}>
              <Text style={styles.linkTypeLabel}>Tipping Link:</Text>
              <View style={styles.linkTypeInfo}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color="#34c759"
                />
                <Text style={styles.linkTypeInfoText}>
                  Secure ID Link - Always available, works anywhere
                </Text>
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

            {/* Username Warning */}
            {useUsername && usernameAvailable === false && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={20} color="#ff9500" />
                <Text style={styles.warningText}>
                  This username is already taken. Please choose a different username or use Secure ID instead.
                </Text>
              </View>
            )}

            {/* Username Checking */}
            {useUsername && checkingUsername && (
              <View style={styles.checkingContainer}>
                <Ionicons name="hourglass-outline" size={16} color="#4B0082" />
                <Text style={styles.checkingText}>Checking username availability...</Text>
              </View>
            )}

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

      {/* Earn More Modal */}
      <Modal
        visible={earnMoreModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEarnMoreModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Earn More with Givta</Text>
            <Text style={styles.modalSubtitle}>
              Discover how to maximize your earnings as a content creator
            </Text>
          </View>

          <View style={styles.modalContent}>
            {/* How Givta Works */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🔸 How Givta Works</Text>
              <Text style={styles.instructionsText}>
                Givta is a modern tipping platform that connects content creators with their fans across all social media platforms. Fans can send tips instantly without needing to install any additional apps - they simply click your shared link and tip through our secure web interface.{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Secure & Instant:</Text> All tips are processed securely and credited to your wallet immediately{'\n'}
                • <Text style={{fontWeight: '600'}}>Cross-Platform:</Text> Works on Instagram, Twitter, TikTok, YouTube, Twitch, Facebook, and more{'\n'}
                • <Text style={{fontWeight: '600'}}>No Middleman Fees:</Text> Keep more of what your fans tip you{'\n'}
                • <Text style={{fontWeight: '600'}}>Global Reach:</Text> Accept tips from fans worldwide
              </Text>
            </View>

            {/* What Content Creators Should Share */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>📝 What to Share for Tips</Text>
              <Text style={styles.instructionsText}>
                Share your unique Givta tipping link in places where your fans are most active:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Social Media Bio:</Text> Add it to your Instagram, Twitter, or TikTok bio with "💰 Tip me here"{'\n'}
                • <Text style={{fontWeight: '600'}}>Live Streams:</Text> Share during Twitch/YouTube/Facebook Live streams{'\n'}
                • <Text style={{fontWeight: '600'}}>Video Descriptions:</Text> Include it in YouTube, TikTok, or Instagram Reel descriptions{'\n'}
                • <Text style={{fontWeight: '600'}}>Stories & Posts:</Text> Share in Stories or pinned posts with tipping instructions{'\n'}
                • <Text style={{fontWeight: '600'}}>Website & Link-in-Bio:</Text> Embed or link on your personal website{'\n'}
                • <Text style={{fontWeight: '600'}}>Discord/Fan Communities:</Text> Share with dedicated fan groups
              </Text>
            </View>

            {/* Where to Share */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>📍 Where to Share Your Link</Text>
              <Text style={styles.instructionsText}>
                Maximize your reach by sharing across multiple platforms:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Instagram:</Text> Bio, Stories, posts, and DMs{'\n'}
                • <Text style={{fontWeight: '600'}}>Twitter/X:</Text> Bio, pinned tweet, and regular tweets{'\n'}
                • <Text style={{fontWeight: '600'}}>TikTok:</Text> Bio, video descriptions, and comments{'\n'}
                • <Text style={{fontWeight: '600'}}>YouTube:</Text> Channel description, video descriptions, and community posts{'\n'}
                • <Text style={{fontWeight: '600'}}>Twitch:</Text> Stream panels, profile, and chat commands{'\n'}
                • <Text style={{fontWeight: '600'}}>Facebook:</Text> Bio, posts, and fan page{'\n'}
                • <Text style={{fontWeight: '600'}}>Reddit:</Text> Profile flair and relevant communities{'\n'}
                • <Text style={{fontWeight: '600'}}>LinkedIn:</Text> For professional content creators{'\n'}
                • <Text style={{fontWeight: '600'}}>Discord:</Text> Server invites and member updates{'\n'}
                • <Text style={{fontWeight: '600'}}>Email Newsletters:</Text> With your content updates
              </Text>
            </View>

            {/* How Givta Works on All Platforms */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🌐 Cross-Platform Benefits</Text>
              <Text style={styles.instructionsText}>
                Givta works seamlessly across all platforms because:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>One Link for Everything:</Text> Use the same link everywhere{'\n'}
                • <Text style={{fontWeight: '600'}}>Mobile-Optimized:</Text> Perfect experience on phones and tablets{'\n'}
                • <Text style={{fontWeight: '600'}}>No App Required:</Text> Fans tip directly from their browser{'\n'}
                • <Text style={{fontWeight: '600'}}>Instant Tips:</Text> No waiting periods or approval processes{'\n'}
                • <Text style={{fontWeight: '600'}}>Secure Payments:</Text> Bank-grade encryption for all transactions{'\n'}
                • <Text style={{fontWeight: '600'}}>Multi-Currency:</Text> Support for multiple currencies worldwide{'\n'}
                • <Text style={{fontWeight: '600'}}>Real-Time Tracking:</Text> See tips arrive in your wallet instantly
              </Text>
            </View>

            {/* Benefits for Content Creators */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>💰 Benefits for Content Creators</Text>
              <Text style={styles.instructionsText}>
                Why choose Givta over other tipping platforms:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Higher Earnings:</Text> Keep more of every tip with lower fees{'\n'}
                • <Text style={{fontWeight: '600'}}>Easy Setup:</Text> Get started in minutes, no complex integrations{'\n'}
                • <Text style={{fontWeight: '600'}}>Fan Engagement:</Text> Strengthen relationships with generous supporters{'\n'}
                • <Text style={{fontWeight: '600'}}>Global Audience:</Text> Accept tips from fans anywhere in the world{'\n'}
                • <Text style={{fontWeight: '600'}}>Multiple Withdrawal Options:</Text> Cash out via bank transfer, mobile money{'\n'}
                • <Text style={{fontWeight: '600'}}>Analytics & Insights:</Text> Track your tipping performance{'\n'}
                • <Text style={{fontWeight: '600'}}>Customizable:</Text> Personalize your tipping experience{'\n'}
                • <Text style={{fontWeight: '600'}}>Reliable Support:</Text> Dedicated help when you need it
              </Text>
            </View>

            {/* What Tipping Links Can Do */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🎯 What Can You Do with Your Tipping Link?</Text>
              <Text style={styles.instructionsText}>
                Your Givta tipping link unlocks powerful features:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Receive Instant Tips:</Text> Get paid directly from fans worldwide{'\n'}
                • <Text style={{fontWeight: '600'}}>Build Fan Communities:</Text> Turn supporters into loyal followers{'\n'}
                • <Text style={{fontWeight: '600'}}>Monetize Content:</Text> Earn from videos, streams, posts, and more{'\n'}
                • <Text style={{fontWeight: '600'}}>Track Analytics:</Text> See who tipped you and when{'\n'}
                • <Text style={{fontWeight: '600'}}>Custom Messages:</Text> Receive personalized support notes{'\n'}
                • <Text style={{fontWeight: '600'}}>Multiple Currencies:</Text> Accept payments in various currencies{'\n'}
                • <Text style={{fontWeight: '600'}}>Secure & Private:</Text> No personal information required from tippers
              </Text>
            </View>

            {/* WhatsApp Bot Integration */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>📱 Chat with Our WhatsApp Bot</Text>
              <Text style={styles.instructionsText}>
                For instant support and easy operations, chat with our AI-powered WhatsApp bot:{'\n\n'}
                • 💬 <Text style={{fontWeight: '600'}}>Get Help:</Text> Ask questions about tipping anytime{'\n'}
                • 🔗 <Text style={{fontWeight: '600'}}>Share Links:</Text> Request bot to share your tipping link{'\n'}
                • 📊 <Text style={{fontWeight: '600'}}>Check Balance:</Text> View earnings and transaction history{'\n'}
                • 🎁 <Text style={{fontWeight: '600'}}>Manage Tips:</Text> Send tips and manage your account{'\n'}
                • 🤖 <Text style={{fontWeight: '600'}}>24/7 Support:</Text> Available anytime, anywhere
              </Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => {
                  // TODO: Add WhatsApp bot deep link
                  Alert.alert('Coming Soon', 'WhatsApp bot integration coming soon!');
                }}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.whatsappButtonText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Benefits for Everyone */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🌍 Benefits of Givta for Everyone</Text>
              <Text style={styles.instructionsText}>
                Givta isn't just for content creators - everyone wins:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>For Content Creators:</Text> Reliable income from passionate fans{'\n'}
                • <Text style={{fontWeight: '600'}}>For Fans:</Text> Easy way to support favorite creators directly{'\n'}
                • <Text style={{fontWeight: '600'}}>For Businesses:</Text> Custom tipping solutions and payment processing{'\n'}
                • <Text style={{fontWeight: '600'}}>For Communities:</Text> Build engaged supporter networks{'\n'}
                • <Text style={{fontWeight: '600'}}>For Everyone:</Text> Borderless financial interactions globally
              </Text>
            </View>

            {/* Givta Website Builder */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🌐 Build Websites with Givta</Text>
              <Text style={styles.instructionsText}>
                Take your online presence to the next level with Givta's website builder:{'\n\n'}
                • <Text style={{fontWeight: '600'}}>Integrated Tipping:</Text> Embed tip buttons directly on your site{'\n'}
                • <Text style={{fontWeight: '600'}}>Custom Domains:</Text> Use your own domain name{'\n'}
                • <Text style={{fontWeight: '600'}}>Mobile Optimized:</Text> Perfect experience on all devices{'\n'}
                • <Text style={{fontWeight: '600'}}>SEO Friendly:</Text> Help search engines find your content{'\n'}
                • <Text style={{fontWeight: '600'}}>Analytics Dashboard:</Text> Track visitors and earnings{'\n'}
                • <Text style={{fontWeight: '600'}}>One-Click Setup:</Text> Launch your site in minutes{'\n\n'}
                Turn your social media following into a professional online presence with built-in monetization!
              </Text>
            </View>

            {/* Step-by-Step Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>🚀 Get Started: Step-by-Step Guide</Text>
              <Text style={styles.instructionsText}>
                <Text style={{fontWeight: '600'}}>Step 1:</Text> Create your unique tipping link in the app{'\n'}
                <Text style={{fontWeight: '600'}}>Step 2:</Text> Choose between secure ID or personalized username{'\n'}
                <Text style={{fontWeight: '600'}}>Step 3:</Text> Copy and share your link across your platforms{'\n'}
                <Text style={{fontWeight: '600'}}>Step 4:</Text> Promote it in your content and engage with fans{'\n'}
                <Text style={{fontWeight: '600'}}>Step 5:</Text> Watch tips come in and track your earnings{'\n'}
                <Text style={{fontWeight: '600'}}>Step 6:</Text> Withdraw earnings whenever you want{'\n\n'}
                <Text style={{color: '#4B0082', fontWeight: '600'}}>Remember:</Text> The more places you share your link, the more tips you'll receive!
              </Text>
            </View>

            {/* Call to Action */}
            <View style={styles.tippingActions}>
              <Button
                title="Create Tipping Link"
                onPress={() => {
                  setEarnMoreModalVisible(false);
                  setTippingModalVisible(true);
                }}
                style={styles.shareButton}
              />
            </View>

            {/* Close Button */}
            <View style={styles.modalCloseContainer}>
              <Button
                title="Close"
                onPress={() => setEarnMoreModalVisible(false)}
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
  // Header Styles
  header: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 20,
    paddingVertical: 29,
    marginBottom: -19,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4B0082',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  earnMoreButton: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  earnMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  deviceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: '#ff3b30',
  },
  deviceDotOk: {
    backgroundColor: '#34c759',
  },
  deviceDotFail: {
    backgroundColor: '#ff3b30',
  },
  deviceIndicatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },

  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#4B0082',
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#9318ebff',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 8,
  },

  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceRight: {
    flexShrink: 0,
    marginLeft: 12,
  },
  statsStack: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statItemStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  // Stats and Actions
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
    marginLeft: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 0,
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.9,
    marginLeft: 0,
    color: '#fff',
  },

  // Compact column for stat text when icon is left
  statTextColumn: {
    flexDirection: 'column',
    marginLeft: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  // Compact column for stacked stats (right-aligned)
  statTextColumnStack: {
    flexDirection: 'column',
    marginLeft: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
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

  // Transaction Styles
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 6,
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

  // Empty States
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

  // Transaction Summary
  summaryCard: {
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Notification Styles
  notificationCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#4B0082',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
    marginLeft: 8,
  },
  notificationScrollView: {
    marginBottom: 12,
  },
  notificationScrollContent: {
    paddingRight: 20,
  },
  notificationItem: {
    width: 280,
    marginRight: 16,
  },
  notificationIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 4,
  },
  notificationIndicatorActive: {
    backgroundColor: '#4B0082',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    width: '20%',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },

  // Challenge Banners
  challengeBannersSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSparkle: {
    fontSize: 16,
    color: '#ff9500',
  },
  challengeBannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  challengeBannerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
    width: '48%',
    height: 80,
    overflow: 'hidden',
    borderWidth: 2,
  },
  challengeBannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  bannerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  bannerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bannerContent: {
    padding: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  bannerMessage: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 2,
  },
  bannerActionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 3,
  },
  pulseContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  pulseDot: {
    fontSize: 14,
    color: '#8B5CF6',
  },

  // Modal Styles
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

  // Tipping Styles
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

  // Warning and Error States
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    lineHeight: 20,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  checkingText: {
    fontSize: 14,
    color: '#4B0082',
    marginLeft: 8,
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
  modalCloseContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  modalCloseButton: {
    borderColor: '#4B0082',
  },

  // Search and Filter
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
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

  // Transaction Detail Modal
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },

  // Legacy/wildcard styles
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

  // Announcements section (kept for compatibility)
  announcementsSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  announcementsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  announcementsHeaderDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginHorizontal: 12,
  },
  announcementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  announcementsList: {
    alignItems: 'center',
  },
  sparkleLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    fontSize: 16,
    color: '#ff9500',
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#4B0082',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    maxWidth: 300,
    marginHorizontal: 8,
    minHeight: 80,
  },
  announcementCardGrid: {
    backgroundColor: '#fff',
    shadowColor: '#4B0082',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  announcementContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  announcementTitleWhite: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 6,
    textAlign: 'center',
  },
  announcementMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  announcementMessageWhite: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 16,
  },
  announcementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  enhancedAnnouncementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 120,
  },
  enhancedAnnouncementContent: {
    padding: 16,
    height: '100%',
  },
  announcementPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 50,
  },
  announcementIconSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementEmoji: {
    fontSize: 24,
  },
  announcementTextSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedAnnouncementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  enhancedAnnouncementMessage: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  enhancedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enhancedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // WhatsApp Button Styles
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25d366',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Username Display Styles
  usernameContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  usernameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  usernameDisplay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  usernameText: {
    fontSize: 16,
    color: '#4B0082',
    fontWeight: '500',
  },
  usernameInfo: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  linkTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#34c759',
  },
  linkTypeInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    marginLeft: 8,
  }
});
