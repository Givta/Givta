import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { notificationCollection, Notification } from '../collections/notifications';

interface NotificationItem extends Notification {
  // Inherits all properties from Notification interface, including optional userId
}

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();

  // Preferences state (for settings modal)
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    transactionAlerts: true,
    referralAlerts: true,
    tipAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    notifications: true, // Master notification toggle
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'transaction' | 'referral' | 'tip' | 'security' | 'system'>('all');

  // Settings modal state
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadPreferences()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await apiService.getUserPreferences();
      if (response.success && response.data) {
        const preferences = response.data;
        // Map backend preferences to component state
        setSettings(prev => ({
          ...prev,
          notifications: preferences.notifications || true,
          pushNotifications: true, // Default for now, adjust based on backend
          emailNotifications: false,
          smsNotifications: false,
          transactionAlerts: true,
          referralAlerts: true,
          tipAlerts: true,
          securityAlerts: true,
          marketingEmails: false,
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        throw new Error(response.error || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const preferences = {
        notifications: settings.notifications,
        language: 'en', // Keep defaults for now
        currency: 'NGN',
        theme: 'light',
      };

      const response = await apiService.updateUserPreferences(preferences);
      if (response.success) {
        Alert.alert('Success', 'Notification settings saved successfully');
      } else {
        throw new Error(response.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              pushNotifications: true,
              emailNotifications: false,
              smsNotifications: false,
              transactionAlerts: true,
              referralAlerts: true,
              tipAlerts: true,
              securityAlerts: true,
              marketingEmails: false,
              notifications: true,
            });
            Alert.alert('Success', 'Settings reset to defaults');
          }
        }
      ]
    );
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(notification => !notification.read);
      case 'transaction':
        return notifications.filter(notification => notification.type === 'transaction');
      case 'referral':
        return notifications.filter(notification => notification.type === 'referral');
      case 'tip':
        return notifications.filter(notification => notification.type === 'tip');
      case 'security':
        return notifications.filter(notification => notification.type === 'security');
      case 'system':
        return notifications.filter(notification => notification.type === 'system');
      case 'all':
      default:
        return notifications;
    }
  };

  const renderNotificationItem = (item: NotificationItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
      onPress={() => item.read ? null : markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationDate}>
          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.notificationType}>
        <Text style={styles.notificationTypeText}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={settingsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSettingsModalVisible(false)}
    >
      <View style={styles.settingsModalContainer}>
        <View style={styles.settingsModalHeader}>
          <Text style={styles.settingsModalTitle}>Notification Settings</Text>
          <TouchableOpacity
            onPress={() => setSettingsModalVisible(false)}
            style={styles.settingsModalClose}
          >
            <Ionicons name="close" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.settingsModalContent}>
          {/* General Settings */}
          <Card style={styles.settingsCard} padding={24} margin={16}>
            <Text style={styles.sectionTitle}>General Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications on your device
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => updateSetting('pushNotifications', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.pushNotifications ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications via email
                </Text>
              </View>
              <Switch
                value={settings.emailNotifications}
                onValueChange={(value) => updateSetting('emailNotifications', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.emailNotifications ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications via SMS (may incur charges)
                </Text>
              </View>
              <Switch
                value={settings.smsNotifications}
                onValueChange={(value) => updateSetting('smsNotifications', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.smsNotifications ? '#fff' : '#f4f3f4'}
              />
            </View>
          </Card>

          {/* Transaction Alerts */}
          <Card style={styles.settingsCard} padding={24} margin={16}>
            <Text style={styles.sectionTitle}>Transaction Alerts</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Transaction Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified about deposits, withdrawals, and transfers
                </Text>
              </View>
              <Switch
                value={settings.transactionAlerts}
                onValueChange={(value) => updateSetting('transactionAlerts', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.transactionAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Referral Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified when you earn referral bonuses
                </Text>
              </View>
              <Switch
                value={settings.referralAlerts}
                onValueChange={(value) => updateSetting('referralAlerts', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.referralAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Tip Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified when you receive tips
                </Text>
              </View>
              <Switch
                value={settings.tipAlerts}
                onValueChange={(value) => updateSetting('tipAlerts', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.tipAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>
          </Card>

          {/* Security & Marketing */}
          <Card style={styles.settingsCard} padding={24} margin={16}>
            <Text style={styles.sectionTitle}>Security & Marketing</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Security Alerts</Text>
                <Text style={styles.settingDescription}>
                  Important security notifications and login alerts (cannot be disabled)
                </Text>
              </View>
              <Switch
                value={settings.securityAlerts}
                onValueChange={(value) => updateSetting('securityAlerts', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.securityAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Marketing Emails</Text>
                <Text style={styles.settingDescription}>
                  Receive promotional emails and product updates
                </Text>
              </View>
              <Switch
                value={settings.marketingEmails}
                onValueChange={(value) => updateSetting('marketingEmails', value)}
                trackColor={{ false: '#8e8e93', true: '#34c759' }}
                thumbColor={settings.marketingEmails ? '#fff' : '#f4f3f4'}
              />
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.settingsModalActions}>
            <Button
              title="Save Settings"
              onPress={handleSaveSettings}
              loading={savingSettings}
              style={styles.saveSettingsButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await savePreferences();
      setSettingsModalVisible(false);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Enhanced Header with Settings Icon */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity
              style={styles.settingsIconButton}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={24} color="#4B0082" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Notification Section */}
        <Card style={styles.mainNotificationCard} padding={20} margin={16}>
          {/* Stats Row */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumberUnread}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={18} color="#4B0082" />
                <Text style={styles.markAllReadText}>Mark All Read</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'transaction', label: 'Transactions' },
              { key: 'referral', label: 'Referrals' },
              { key: 'tip', label: 'Tips' },
              { key: 'security', label: 'Security' },
              { key: 'system', label: 'System' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterButton,
                  filter === key && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === key && styles.filterButtonTextActive,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Notification List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#8e8e93" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>We'll notify you when there's something new</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.notificationsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              {getFilteredNotifications().map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <View style={styles.notificationSeparator} />}
                  {renderNotificationItem(item)}
                </React.Fragment>
              ))}
            </ScrollView>
          )}
        </Card>
      </View>

      {/* Settings Modal */}
      {settingsModalVisible && renderSettingsModal()}
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
  // New header styles
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  settingsIconButton: {
    padding: 8,
  },
  // Settings modal styles
  settingsModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  settingsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4B0082',
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  settingsModalClose: {
    padding: 4,
  },
  settingsModalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsModalActions: {
    padding: 20,
    paddingBottom: 40,
  },
  saveSettingsButton: {
    backgroundColor: '#4B0082',
  },
  // Main notification section
  mainNotificationCard: {
    backgroundColor: '#fff',
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  statNumberUnread: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e1e5e9',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 8,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B0082',
    marginLeft: 6,
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
  },
  notificationSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4B0082',
  },
  resetButton: {
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
  // Notification History Styles
  notificationsCard: {
    backgroundColor: '#fff',
    maxHeight: 600,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  notificationItemUnread: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#4B0082',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4B0082',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#adb5bd',
  },
  notificationType: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  notificationTypeText: {
    fontSize: 12,
    color: '#495057',
    textTransform: 'capitalize',
  },
});
