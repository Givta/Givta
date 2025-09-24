import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const NotificationsScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    transactionAlerts: true,
    referralAlerts: true,
    tipAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [loading, setLoading] = useState(false);

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
            });
            Alert.alert('Success', 'Settings reset to defaults');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Manage your notification preferences</Text>
        </View>

        {/* General Settings */}
        <Card style={styles.card} padding={20} margin={16}>
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
                Receive notifications via SMS
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
        <Card style={styles.card} padding={20} margin={16}>
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
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Security & Marketing</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Security Alerts</Text>
              <Text style={styles.settingDescription}>
                Important security notifications and login alerts
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
        <View style={styles.buttonContainer}>
          <Button
            title="Save Settings"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          <Button
            title="Reset to Defaults"
            onPress={handleResetToDefaults}
            variant="outline"
            style={styles.resetButton}
          />
        </View>

        {/* Info Section */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.infoTitle}>💡 Notification Tips</Text>
          <Text style={styles.infoText}>
            • Push notifications require device permissions{'\n'}
            • SMS notifications may incur additional charges{'\n'}
            • Security alerts cannot be disabled for your safety{'\n'}
            • You can change these settings anytime
          </Text>
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
});
