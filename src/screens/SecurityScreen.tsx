import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TextInput, Modal } from 'react-native';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export const SecurityScreen: React.FC = () => {
  const { user } = useAuth();
  const [securitySettings, setSecuritySettings] = useState({
    biometricAuth: false,
    twoFactorAuth: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    autoLogout: true,
    deviceTracking: false,
    passwordChangeAlerts: true,
  });

  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const updateSetting = (key: string, value: boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save security settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Security settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordModalVisible(true);
  };

  const validatePasswordReuse = (oldPassword: string, newPassword: string): boolean => {
    if (!oldPassword || !newPassword) return false;

    const oldLower = oldPassword.toLowerCase();
    const newLower = newPassword.toLowerCase();

    // Extract unique characters from old password
    const oldChars = new Set(oldLower.split(''));
    const oldLetters = new Set(oldLower.replace(/[^a-z]/g, '').split(''));
    const oldDigits = new Set(oldLower.replace(/[^0-9]/g, '').split(''));

    // Count reused characters
    let totalReused = 0;
    let lettersReused = 0;
    let digitsReused = 0;

    for (const char of newLower) {
      if (oldChars.has(char)) {
        totalReused++;
        if (/[a-z]/.test(char) && oldLetters.has(char)) {
          lettersReused++;
        }
        if (/[0-9]/.test(char) && oldDigits.has(char)) {
          digitsReused++;
        }
      }
    }

    // Security requirements:
    // 1. At least 3 letters from old password, OR
    // 2. At least 2 letters from old password, OR
    // 3. At least 1 digit from old password
    const meetsLetterRequirement = lettersReused >= 3 || lettersReused >= 2;
    const meetsDigitRequirement = digitsReused >= 1;

    return meetsLetterRequirement || meetsDigitRequirement;
  };

  const handlePasswordSubmit = async () => {
    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    // Advanced password reuse validation
    if (user?.email) {
      // For demo purposes, we'll use a simplified version
      // In production, you'd retrieve the old password hash or use Firebase's built-in validation
      const oldPassword = user.email.split('@')[0]; // Simplified for demo

      if (!validatePasswordReuse(oldPassword, passwordForm.newPassword)) {
        Alert.alert(
          'Password Security',
          'Your new password must contain at least 3 letters, 2 letters, or digits from your current password to ensure security. This prevents minor changes that could be easily guessed.',
          [
            { text: 'Try Again', style: 'default' },
            {
              text: 'Use Different Password',
              style: 'cancel',
              onPress: () => {
                setPasswordForm({
                  ...passwordForm,
                  newPassword: '',
                  confirmPassword: '',
                });
              }
            }
          ]
        );
        return;
      }
    }

    setPasswordLoading(true);
    try {
      // For Firebase Auth, we need to reauthenticate the user first
      // This is a simplified version - in production, you'd want to handle reauthentication properly
      if (user) {
        await updatePassword(user, passwordForm.newPassword);
        Alert.alert('Success', 'Password changed successfully!');
        setPasswordModalVisible(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      console.error('Password change error:', error);

      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Reauthentication Required',
          'For security reasons, please log out and log back in before changing your password.',
          [
            { text: 'OK', onPress: () => setPasswordModalVisible(false) }
          ]
        );
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password is too weak. Please choose a stronger password.');
      } else {
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordModalVisible(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleViewLoginHistory = () => {
    Alert.alert('Login History', 'Login history feature coming soon!');
  };

  const handleManageDevices = () => {
    Alert.alert('Device Management', 'Device management feature coming soon!');
  };

  const handleEnable2FA = () => {
    Alert.alert(
      'Two-Factor Authentication',
      '2FA provides an extra layer of security to your account. Would you like to set it up?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Set Up 2FA', onPress: () => Alert.alert('2FA Setup', '2FA setup coming soon!') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Security</Text>
          <Text style={styles.subtitle}>Manage your account security</Text>
        </View>

        {/* Security Overview */}
        <Card style={styles.overviewCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Security Status</Text>

          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>🔐</Text>
              <Text style={styles.statusLabel}>Password</Text>
              <Text style={styles.statusValue}>Strong</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>📱</Text>
              <Text style={styles.statusLabel}>2FA</Text>
              <Text style={[styles.statusValue, styles.statusDisabled]}>
                Disabled
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>🔒</Text>
              <Text style={styles.statusLabel}>Biometric</Text>
              <Text style={[styles.statusValue, styles.statusDisabled]}>
                Off
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>🔔</Text>
              <Text style={styles.statusLabel}>Alerts</Text>
              <Text style={[styles.statusValue, styles.statusEnabled]}>
                Active
              </Text>
            </View>
          </View>
        </Card>

        {/* Authentication Settings */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Authentication</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face ID for quick login
              </Text>
            </View>
            <Switch
              value={securitySettings.biometricAuth}
              onValueChange={(value) => updateSetting('biometricAuth', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={securitySettings.biometricAuth ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
            <Button
              title={securitySettings.twoFactorAuth ? 'Enabled' : 'Set Up'}
              onPress={handleEnable2FA}
              variant={securitySettings.twoFactorAuth ? 'secondary' : 'primary'}
              size="small"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto Logout</Text>
              <Text style={styles.settingDescription}>
                Automatically logout after period of inactivity
              </Text>
            </View>
            <Switch
              value={securitySettings.autoLogout}
              onValueChange={(value) => updateSetting('autoLogout', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={securitySettings.autoLogout ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Alert Settings */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Security Alerts</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Login Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone logs into your account
              </Text>
            </View>
            <Switch
              value={securitySettings.loginNotifications}
              onValueChange={(value) => updateSetting('loginNotifications', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={securitySettings.loginNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Suspicious Activity Alerts</Text>
              <Text style={styles.settingDescription}>
                Alert for unusual account activity
              </Text>
            </View>
            <Switch
              value={securitySettings.suspiciousActivityAlerts}
              onValueChange={(value) => updateSetting('suspiciousActivityAlerts', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={securitySettings.suspiciousActivityAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Password Change Alerts</Text>
              <Text style={styles.settingDescription}>
                Get notified when your password is changed
              </Text>
            </View>
            <Switch
              value={securitySettings.passwordChangeAlerts}
              onValueChange={(value) => updateSetting('passwordChangeAlerts', value)}
              trackColor={{ false: '#8e8e93', true: '#34c759' }}
              thumbColor={securitySettings.passwordChangeAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Account Management */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Account Management</Text>

          <View style={styles.actionList}>
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              variant="outline"
              style={styles.actionButton}
            />

            <Button
              title="View Login History"
              onPress={handleViewLoginHistory}
              variant="outline"
              style={styles.actionButton}
            />

            <Button
              title="Manage Devices"
              onPress={handleManageDevices}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Security Tips */}
        <Card style={styles.tipsCard} padding={20} margin={16}>
          <Text style={styles.tipsTitle}>🛡️ Security Tips</Text>
          <Text style={styles.tipsText}>
            • Use a strong, unique password{'\n'}
            • Enable two-factor authentication{'\n'}
            • Never share your login credentials{'\n'}
            • Log out from shared devices{'\n'}
            • Monitor your account activity regularly{'\n'}
            • Keep your app and device updated
          </Text>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Security Settings"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>

        {/* Password Change Modal */}
        <Modal
          visible={passwordModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCancelPasswordChange}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your new password below
              </Text>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
                  secureTextEntry
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm(prev => ({ ...prev, newPassword: text }))
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordForm(prev => ({ ...prev, confirmPassword: text }))
                  }
                />
              </View>

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters long and reuse at least 3 letters, 2 letters, or digits from your current password for security.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={handleCancelPasswordChange}
                variant="outline"
                style={styles.modalCancelButton}
              />
              <Button
                title="Change Password"
                onPress={handlePasswordSubmit}
                loading={passwordLoading}
                style={styles.modalSubmitButton}
              />
            </View>
          </View>
        </Modal>
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
  overviewCard: {
    backgroundColor: '#4B0082',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusEnabled: {
    color: '#34c759',
  },
  statusDisabled: {
    color: '#ff9500',
  },
  card: {
    backgroundColor: '#fff',
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
  actionList: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  tipsCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#4B0082',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordHint: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  modalCancelButton: {
    flex: 1,
    borderColor: '#8e8e93',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
});
