import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    Alert.alert('Coming Soon', 'Profile editing features will be available soon!');
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>Update your personal information</Text>
        </View>

        {/* Profile Avatar */}
        <Card style={styles.avatarCard} padding={24} margin={16}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </Text>
            </View>
            <Button
              title="Change Photo"
              onPress={() => Alert.alert('Coming Soon', 'Photo upload feature coming soon')}
              variant="secondary"
              size="small"
              style={styles.changePhotoButton}
            />
          </View>
        </Card>

        {/* Form Fields */}
        <Card style={styles.formCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>
                {user?.displayName || 'Not set'}
              </Text>
              <Button
                title="Edit"
                onPress={() => Alert.alert('Edit Name', 'Name editing coming soon')}
                variant="outline"
                size="small"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{user?.email}</Text>
              <Text style={styles.readOnlyText}>(Cannot be changed)</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>
                {user?.phoneNumber || 'Not provided'}
              </Text>
              <Button
                title="Edit"
                onPress={() => Alert.alert('Edit Phone', 'Phone editing coming soon')}
                variant="outline"
                size="small"
              />
            </View>
          </View>
        </Card>

        {/* Account Information */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Recently'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, styles.statusActive]}>Active</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Verified</Text>
            <Text style={[
              styles.infoValue,
              user?.emailVerified ? styles.statusVerified : styles.statusUnverified
            ]}>
              {user?.emailVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          <Button
            title="Cancel"
            onPress={() => Alert.alert('Cancel', 'Discard changes?', [
              { text: 'Keep Editing', style: 'cancel' },
              { text: 'Discard', onPress: () => {/* Navigation back */} }
            ])}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  avatarCard: {
    backgroundColor: '#4B0082',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  changePhotoButton: {
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  inputText: {
    fontSize: 16,
    color: '#1c1c1e',
    flex: 1,
  },
  readOnlyText: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  infoValue: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  statusActive: {
    color: '#34c759',
  },
  statusVerified: {
    color: '#34c759',
  },
  statusUnverified: {
    color: '#ff9500',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4B0082',
  },
  cancelButton: {
    borderColor: '#8e8e93',
  },
});
