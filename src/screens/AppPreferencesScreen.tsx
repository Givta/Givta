import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const AppPreferencesScreen: React.FC = () => {
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'English',
    currency: 'NGN',
    notifications: true,
    hapticFeedback: true,
    autoLock: true,
    biometricAuth: false,
    dataSaver: false,
  });

  const [loading, setLoading] = useState(false);

  const updatePreference = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save preferences to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Preferences saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPreferences({
              darkMode: false,
              language: 'English',
              currency: 'NGN',
              notifications: true,
              hapticFeedback: true,
              autoLock: true,
              biometricAuth: false,
              dataSaver: false,
            });
            Alert.alert('Success', 'Preferences reset to defaults');
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
          <Text style={styles.title}>App Preferences</Text>
          <Text style={styles.subtitle}>Customize your app experience</Text>
        </View>

        {/* Appearance */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Switch to dark theme for better visibility in low light
              </Text>
            </View>
            <Switch
              value={preferences.darkMode}
              onValueChange={(value) => updatePreference('darkMode', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.darkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Language & Region */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Language & Region</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingDescription}>
                Choose your preferred language
              </Text>
            </View>
            <Button
              title={preferences.language}
              onPress={() => Alert.alert('Language', 'Language selection coming soon')}
              variant="outline"
              size="small"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Currency</Text>
              <Text style={styles.settingDescription}>
                Default currency for transactions
              </Text>
            </View>
            <Button
              title={preferences.currency}
              onPress={() => Alert.alert('Currency', 'Currency selection coming soon')}
              variant="outline"
              size="small"
            />
          </View>
        </Card>

        {/* Notifications */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications about your account activity
              </Text>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => updatePreference('notifications', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Accessibility */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Enable vibration feedback for interactions
              </Text>
            </View>
            <Switch
              value={preferences.hapticFeedback}
              onValueChange={(value) => updatePreference('hapticFeedback', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.hapticFeedback ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Security */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto Lock</Text>
              <Text style={styles.settingDescription}>
                Automatically lock the app after inactivity
              </Text>
            </View>
            <Switch
              value={preferences.autoLock}
              onValueChange={(value) => updatePreference('autoLock', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.autoLock ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face ID for quick access
              </Text>
            </View>
            <Switch
              value={preferences.biometricAuth}
              onValueChange={(value) => updatePreference('biometricAuth', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.biometricAuth ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Data & Storage */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Data Saver</Text>
              <Text style={styles.settingDescription}>
                Reduce data usage by limiting background updates
              </Text>
            </View>
            <Switch
              value={preferences.dataSaver}
              onValueChange={(value) => updatePreference('dataSaver', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={preferences.dataSaver ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Preferences"
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
          <Text style={styles.infoTitle}>💡 Preference Tips</Text>
          <Text style={styles.infoText}>
            • Changes take effect immediately after saving{'\n'}
            • Some features may require app restart{'\n'}
            • Biometric authentication requires device support{'\n'}
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
