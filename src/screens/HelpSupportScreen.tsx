import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export const HelpSupportScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: 'other',
    subject: '',
    message: '',
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const supportCategories = [
    {
      id: 'account',
      title: 'Account & Login',
      icon: '👤',
      description: 'Login issues, password reset, account verification',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: '💰',
      description: 'Deposits, withdrawals, transfers, and transaction history',
    },
    {
      id: 'wallet',
      title: 'Wallet & Balance',
      icon: '👛',
      description: 'Balance issues, wallet management, and funds',
    },
    {
      id: 'referrals',
      title: 'Referrals & Bonuses',
      icon: '🎁',
      description: 'Referral program, bonus tracking, and rewards',
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: '🔒',
      description: 'Account security, privacy concerns, and data protection',
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      icon: '⚙️',
      description: 'App crashes, bugs, and technical problems',
    },
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      icon: '📧',
      action: () => {
        const email = 'support@givta.app, givtamanager@gmail.com';
        const subject = 'Givta App Support Request';
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'Call Support',
      icon: '📞',
      action: () => {
        const phoneNumber = '+234 813 927 0820';
        Linking.openURL(`tel:${phoneNumber}`);
      },
    },
    {
      title: 'WhatsApp Support',
      icon: '💬',
      action: () => {
        const phoneNumber = '+234 813 927 0820';
        const message = 'Hi, I need help with the Givta app';
        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'Submit Feedback',
      icon: '💬',
      action: () => setFeedbackModalVisible(true),
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = supportCategories.find(cat => cat.id === categoryId);
    Alert.alert(
      category?.title || 'Support',
      `How can we help you with ${category?.title.toLowerCase()}?`,
      [
        { text: 'Email Support', onPress: () => quickActions[0].action() },
        { text: 'Call Support', onPress: () => quickActions[1].action() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await apiService.submitFeedback({
        rating: feedbackForm.rating,
        category: feedbackForm.category,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        deviceInfo: {
          platform: 'mobile',
          appVersion: '1.0.0',
        },
      });

      if (response.success) {
        Alert.alert('Success', 'Thank you for your feedback! We appreciate your input.');
        setFeedbackModalVisible(false);
        setFeedbackForm({
          rating: 5,
          category: 'other',
          subject: '',
          message: '',
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCancelFeedback = () => {
    setFeedbackModalVisible(false);
    setFeedbackForm({
      rating: 5,
      category: 'other',
      subject: '',
      message: '',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>We're here to help you</Text>
        </View>

        {/* Quick Actions */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAction}
                onPress={action.action}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Support Categories */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Get Help By Category</Text>
          <View style={styles.categoriesList}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemSelected,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.categoryArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📧</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@givta.app, givtamanager@gmail.com</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📞</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+234 813 927 0820</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>💬</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>+234 813 927 0820</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>🕒</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Support Hours</Text>
                <Text style={styles.contactValue}>Mon-Fri: 9AM - 6PM WAT</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Response Time */}
        <Card style={styles.infoCard} padding={20} margin={16}>
          <Text style={styles.infoTitle}>⏱️ Response Times</Text>
          <Text style={styles.infoText}>
            • Email: Within 24 hours{'\n'}
            • Phone/WhatsApp: Immediate during business hours{'\n'}
            • Emergency issues: Priority handling{'\n'}
            • Average response time: 4 hours
          </Text>
        </Card>

        {/* Troubleshooting Tips */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Quick Troubleshooting</Text>

          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>1</Text>
              <Text style={styles.tipText}>
                Restart the app and try again
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>2</Text>
              <Text style={styles.tipText}>
                Check your internet connection
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>3</Text>
              <Text style={styles.tipText}>
                Update the app to the latest version
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>4</Text>
              <Text style={styles.tipText}>
                Clear app cache and data
              </Text>
            </View>
          </View>
        </Card>

        {/* Emergency Contact */}
        <Card style={styles.emergencyCard} padding={20} margin={16}>
          <Text style={styles.emergencyTitle}>🚨 Emergency Support</Text>
          <Text style={styles.emergencyText}>
            For urgent security issues or account emergencies, contact us immediately at emergency@givta.app or call +234 813 927 0820.
          </Text>
        </Card>

        {/* Feedback Modal */}
        <Modal
          visible={feedbackModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCancelFeedback}
        >
          <ScrollView style={styles.feedbackModalContainer}>
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>Submit Feedback</Text>
              <Text style={styles.feedbackModalSubtitle}>
                Help us improve by sharing your thoughts
              </Text>
            </View>

            <View style={styles.feedbackModalContent}>
              {/* Rating */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.feedbackInputLabel}>Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                    >
                      <Text style={[
                        styles.starIcon,
                        feedbackForm.rating >= star && styles.starIconSelected
                      ]}>
                        ⭐
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {feedbackForm.rating === 5 ? 'Excellent' :
                   feedbackForm.rating === 4 ? 'Good' :
                   feedbackForm.rating === 3 ? 'Average' :
                   feedbackForm.rating === 2 ? 'Poor' : 'Very Poor'}
                </Text>
              </View>

              {/* Category */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.feedbackInputLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {[
                    { key: 'bug', label: 'Bug Report' },
                    { key: 'feature', label: 'Feature Request' },
                    { key: 'ui', label: 'UI/UX Issue' },
                    { key: 'performance', label: 'Performance' },
                    { key: 'other', label: 'Other' }
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryOption,
                        feedbackForm.category === category.key && styles.categoryOptionSelected
                      ]}
                      onPress={() => setFeedbackForm(prev => ({ ...prev, category: category.key }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        feedbackForm.category === category.key && styles.categoryOptionTextSelected
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subject */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.feedbackInputLabel}>Subject (Optional)</Text>
                <TextInput
                  style={styles.feedbackTextInput}
                  placeholder="Brief summary of your feedback"
                  value={feedbackForm.subject}
                  onChangeText={(text) => setFeedbackForm(prev => ({ ...prev, subject: text }))}
                  maxLength={100}
                />
              </View>

              {/* Message */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.feedbackInputLabel}>Message</Text>
                <TextInput
                  style={[styles.feedbackTextInput, styles.messageInput]}
                  placeholder="Tell us what you think... What features do you love? What could be improved?"
                  value={feedbackForm.message}
                  onChangeText={(text) => setFeedbackForm(prev => ({ ...prev, message: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>

              {/* Character count */}
              <Text style={styles.characterCount}>
                {feedbackForm.message.length}/1000 characters
              </Text>
            </View>

            <View style={styles.feedbackModalButtons}>
              <Button
                title="Cancel"
                onPress={handleCancelFeedback}
                variant="outline"
                style={styles.feedbackCancelButton}
              />
              <Button
                title="Submit Feedback"
                onPress={handleSubmitFeedback}
                loading={submittingFeedback}
                style={styles.feedbackSubmitButton}
                disabled={!feedbackForm.message.trim()}
              />
            </View>
          </ScrollView>
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
  card: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#4B0082',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  categoryArrow: {
    fontSize: 20,
    color: '#8e8e93',
  },
  contactList: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  contactValue: {
    fontSize: 14,
    color: '#8e8e93',
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
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  tipNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B0082',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#1c1c1e',
    flex: 1,
  },
  emergencyCard: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 14,
    color: '#c62828',
    lineHeight: 22,
  },
  feedbackModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  feedbackModalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  feedbackModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  feedbackModalSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  feedbackModalContent: {
    flex: 1,
    padding: 20,
  },
  feedbackInputGroup: {
    marginBottom: 24,
  },
  feedbackInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starIcon: {
    fontSize: 32,
    color: '#d1d5db',
  },
  starIconSelected: {
    color: '#fbbf24',
  },
  ratingText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  categoryOptionSelected: {
    backgroundColor: '#4B0082',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  feedbackTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 4,
  },
  feedbackModalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  feedbackCancelButton: {
    flex: 1,
    borderColor: '#8e8e93',
  },
  feedbackSubmitButton: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
});
