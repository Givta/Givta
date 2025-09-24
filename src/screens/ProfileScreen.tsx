import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EditProfileScreen } from './EditProfileScreen';
import { AppPreferencesScreen } from './AppPreferencesScreen';
import { TermsOfServiceScreen } from './TermsOfServiceScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { HelpSupportScreen } from './HelpSupportScreen';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getAccountStatus = () => {
    // TODO: Get actual account status from backend
    return 'Active';
  };

  const getMemberSince = () => {
    if (!user?.metadata?.creationTime) return 'Recently';
    const creationDate = new Date(user.metadata.creationTime);
    return new Intl.DateTimeFormat('en-NG', {
      month: 'long',
      year: 'numeric',
    }).format(creationDate);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please login to view your profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard} padding={24} margin={16}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getUserInitials(user.email || 'U')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.displayName || 'Givta User'}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>
                Member since {getMemberSince()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Overview */}
        <Card style={styles.overviewCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Account Overview</Text>

          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Current Balance</Text>
              <Text style={styles.overviewValue}>{formatCurrency(balance)}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Account Status</Text>
              <Text style={[styles.overviewValue, styles.statusValue]}>
                {getAccountStatus()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('HelpSupport' as never)}
            >
              <Ionicons name="help-circle-outline" size={32} color="#4B0082" />
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Security' as never)}
            >
              <Ionicons name="shield-checkmark-outline" size={32} color="#4B0082" />
              <Text style={styles.actionText}>Security</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('AppPreferences' as never)}
            >
              <Ionicons name="settings-outline" size={32} color="#4B0082" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Analytics' as never)}
            >
              <Ionicons name="bar-chart-outline" size={32} color="#4B0082" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Account Settings */}
        <Card style={styles.settingsCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <View style={styles.settingsList}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={20} color="#4B0082" />
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('AppPreferences' as never)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color="#4B0082" />
                <Text style={styles.settingText}>App Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* App Information */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>About Givta</Text>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('TermsOfService' as never)}
            >
              <Text style={styles.infoLabel}>Terms of Service</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            >
              <Text style={styles.infoLabel}>Privacy Policy</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('HelpSupport' as never)}
            >
              <Text style={styles.infoLabel}>Help & Support</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            loading={loading}
            variant="outline"
            style={styles.logoutButton}
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
  profileCard: {
    backgroundColor: '#4B0082',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  overviewCard: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  statusValue: {
    color: '#34c759',
  },
  actionsCard: {
    backgroundColor: '#fff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  settingsCard: {
    backgroundColor: '#fff',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  settingArrow: {
    fontSize: 20,
    color: '#8e8e93',
  },
  infoCard: {
    backgroundColor: '#fff',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  infoValue: {
    fontSize: 16,
    color: '#8e8e93',
  },
  infoArrow: {
    fontSize: 20,
    color: '#8e8e93',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
});
