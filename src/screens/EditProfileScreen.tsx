import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emailVerified: boolean;
  kycStatus: string;
  referralCode: string;
}

export const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit states
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Form values
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');

  // Username availability
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Feedback form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('other');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setDisplayName(data.data.displayName || '');
        setPhoneNumber(data.data.phoneNumber || '');
        setUsername(data.data.username || '');
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoadingProfile(false);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    try {
      setCheckingUsername(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToCheck }),
      });

      const data = await response.json();

      if (data.success) {
        setUsernameAvailable(data.data.available);
      } else {
        setUsernameAvailable(null);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Debounce username checking
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(text);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const saveDisplayName = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setEditingDisplayName(false);
        Alert.alert('Success', 'Display name updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update display name');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update display name');
    } finally {
      setLoading(false);
    }
  };

  const savePhoneNumber = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setEditingPhoneNumber(false);
        Alert.alert('Success', 'Phone number updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update phone number');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const saveUsername = async () => {
    if (!usernameAvailable) {
      Alert.alert('Error', 'Please choose an available username');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/change-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          newUsername: username.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => prev ? { ...prev, username: data.data.username } : null);
        setEditingUsername(false);
        Alert.alert('Success', 'Username updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update username');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          rating: feedbackRating,
          category: feedbackCategory,
          subject: feedbackSubject.trim(),
          message: feedbackMessage.trim(),
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowFeedbackModal(false);
        setFeedbackRating(5);
        setFeedbackCategory('other');
        setFeedbackSubject('');
        setFeedbackMessage('');
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully. We appreciate your input!');
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
                {profile?.displayName?.substring(0, 2).toUpperCase() ||
                 profile?.email?.substring(0, 2).toUpperCase() || 'U'}
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

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            {editingUsername ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Enter username"
                  maxLength={20}
                  autoCapitalize="none"
                />
                {checkingUsername && (
                  <Ionicons name="hourglass-outline" size={20} color="#4B0082" style={styles.inputIcon} />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <Ionicons name="close-circle" size={20} color="#ff3b30" style={styles.inputIcon} />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Ionicons name="checkmark-circle" size={20} color="#34c759" style={styles.inputIcon} />
                )}
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditingUsername(false)}>
                    <Ionicons name="close" size={24} color="#8e8e93" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveUsername} disabled={!usernameAvailable || loading}>
                    <Ionicons name="checkmark" size={24} color={usernameAvailable ? "#34c759" : "#8e8e93"} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>
                  {profile?.username || 'Not set'}
                </Text>
                <Button
                  title="Edit"
                  onPress={() => setEditingUsername(true)}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
            {editingUsername && !checkingUsername && usernameAvailable === false && (
              <Text style={styles.errorText}>Username is already taken</Text>
            )}
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            {editingDisplayName ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditingDisplayName(false)}>
                    <Ionicons name="close" size={24} color="#8e8e93" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveDisplayName} disabled={loading}>
                    <Ionicons name="checkmark" size={24} color="#34c759" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>
                  {profile?.displayName || 'Not set'}
                </Text>
                <Button
                  title="Edit"
                  onPress={() => setEditingDisplayName(true)}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{profile?.email}</Text>
              <Text style={styles.readOnlyText}>(Cannot be changed)</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {editingPhoneNumber ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditingPhoneNumber(false)}>
                    <Ionicons name="close" size={24} color="#8e8e93" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={savePhoneNumber} disabled={loading}>
                    <Ionicons name="checkmark" size={24} color="#34c759" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>
                  {profile?.phoneNumber || 'Not provided'}
                </Text>
                <Button
                  title="Edit"
                  onPress={() => setEditingPhoneNumber(true)}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
          </View>
        </Card>

        {/* Account Information */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
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
              profile?.emailVerified ? styles.statusVerified : styles.statusUnverified
            ]}>
              {profile?.emailVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>KYC Status</Text>
            <Text style={[
              styles.infoValue,
              profile?.kycStatus === 'verified' ? styles.statusVerified :
              profile?.kycStatus === 'pending' ? styles.statusPending : styles.statusUnverified
            ]}>
              {profile?.kycStatus?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </Card>

        {/* Feedback Section */}
        <Card style={styles.feedbackCard} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Help Us Improve</Text>
          <Text style={styles.feedbackDescription}>
            Your feedback helps us make Givta better. Share your thoughts, report bugs, or suggest new features.
          </Text>
          <Button
            title="Submit Feedback"
            onPress={() => setShowFeedbackModal(true)}
            style={styles.feedbackButton}
            size="small"
          />
        </Card>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8e8e93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Share Your Feedback</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How would you rate your experience?</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFeedbackRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= feedbackRating ? "star" : "star-outline"}
                      size={32}
                      color={star <= feedbackRating ? "#FFD700" : "#8e8e93"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {feedbackRating === 1 && "Poor"}
                {feedbackRating === 2 && "Fair"}
                {feedbackRating === 3 && "Good"}
                {feedbackRating === 4 && "Very Good"}
                {feedbackRating === 5 && "Excellent"}
              </Text>
            </View>

            {/* Category Section */}
            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: 'bug', label: 'Bug Report', icon: 'bug-outline' },
                  { key: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
                  { key: 'ui', label: 'UI/UX', icon: 'eye-outline' },
                  { key: 'performance', label: 'Performance', icon: 'speedometer-outline' },
                  { key: 'other', label: 'Other', icon: 'chatbubble-outline' },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      feedbackCategory === category.key && styles.categoryButtonActive
                    ]}
                    onPress={() => setFeedbackCategory(category.key)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={feedbackCategory === category.key ? "#fff" : "#4B0082"}
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      feedbackCategory === category.key && styles.categoryButtonTextActive
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject (Optional)</Text>
              <TextInput
                style={styles.subjectInput}
                placeholder="Brief summary of your feedback"
                value={feedbackSubject}
                onChangeText={setFeedbackSubject}
                maxLength={100}
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Feedback *</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Please share your detailed feedback, suggestions, or describe the issue you're experiencing..."
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                multiline
                numberOfLines={6}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {feedbackMessage.length}/1000
              </Text>
            </View>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <Button
                title="Submit Feedback"
                onPress={submitFeedback}
                loading={loading}
                disabled={!feedbackMessage.trim()}
                style={styles.submitButton}
              />
              <Text style={styles.privacyText}>
                Your feedback helps us improve Givta. We may contact you for clarification.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
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
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1c1e',
    paddingVertical: 8,
  },
  inputIcon: {
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    marginTop: 4,
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
  statusPending: {
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
  feedbackCard: {
    backgroundColor: '#fff',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#4B0082',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#4B0082',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4B0082',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#4B0082',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4B0082',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#4B0082',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
  },
});
