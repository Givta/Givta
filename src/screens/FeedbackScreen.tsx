import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FeedbackCollection, Feedback } from '../collections/feedback';

interface FeedbackType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface FeedbackSubmission {
  id?: string;
  type: string;
  rating: number;
  subject: string;
  message: string;
  userId: string;
  userEmail?: string;
  createdAt: any;
  status: 'pending' | 'reviewed' | 'resolved';
}

const feedbackTypes: FeedbackType[] = [
  {
    id: 'bug_report',
    title: 'Bug Report',
    description: 'Report a problem or error',
    icon: '🐛',
    color: '#FF6B6B'
  },
  {
    id: 'feature_request',
    title: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    icon: '💡',
    color: '#4ECDC4'
  },
  {
    id: 'general_feedback',
    title: 'General Feedback',
    description: 'Share your thoughts and suggestions',
    icon: '💬',
    color: '#45B7D1'
  },
  {
    id: 'ui_improvement',
    title: 'UI/UX Feedback',
    description: 'Feedback about design and user experience',
    icon: '🎨',
    color: '#96CEB4'
  },
  {
    id: 'performance',
    title: 'Performance Issue',
    description: 'Report slow loading or crashes',
    icon: '⚡',
    color: '#FFEAA7'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Something else on your mind',
    icon: '📝',
    color: '#DDA0DD'
  }
];

export const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackSubmission[]>([]);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState<boolean>(false);

  useEffect(() => {
    loadFeedbackHistory();
  }, [user]);

  const loadFeedbackHistory = async () => {
    if (!user?.id) return;

    try {
      const feedbackData = await FeedbackCollection.getByUserId(user.id, 10);
      const formattedFeedback: FeedbackSubmission[] = feedbackData.map(f => ({
        id: f.id,
        type: f.type,
        rating: f.rating,
        subject: f.subject,
        message: f.message,
        userId: f.userId,
        userEmail: f.userEmail,
        createdAt: f.createdAt,
        status: f.status
      }));

      setSubmittedFeedback(formattedFeedback);
    } catch (error) {
      console.error('Error loading feedback history:', error);
    }
  };

  const submitFeedback = async () => {
    if (!user?.id || !selectedType || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields and select a feedback type.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for your experience.');
      return;
    }

    setLoading(true);

    try {
      // Map the selectedType to the correct format expected by FeedbackCollection
      const feedbackTypeMap: Record<string, 'bug_report' | 'feature_request' | 'general_feedback' | 'ui_improvement' | 'performance' | 'other'> = {
        'bug_report': 'bug_report',
        'feature_request': 'feature_request',
        'general_feedback': 'general_feedback',
        'ui_improvement': 'ui_improvement',
        'performance': 'performance',
        'other': 'other'
      };

      const mappedType = feedbackTypeMap[selectedType] || 'general_feedback';

      await FeedbackCollection.create({
        rating,
        type: mappedType,
        subject: subject.trim(),
        message: message.trim(),
        userId: user.id,
        userEmail: user.email || ''
      });

      // Reset form
      setSelectedType('');
      setRating(0);
      setSubject('');
      setMessage('');

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload feedback history
      loadFeedbackHistory();

      Alert.alert('Thank You!', 'Your feedback has been submitted successfully. We appreciate you helping us improve Givta!');

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rate your experience:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={styles.starButton}
              onPress={() => setRating(star)}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? "#FFD700" : "#8e8e93"}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Select a rating' :
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' : 'Excellent'}
        </Text>
      </View>
    );
  };

  const renderFeedbackType = (type: FeedbackType) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.feedbackTypeCard,
        selectedType === type.id && { borderColor: type.color, backgroundColor: type.color + '10' }
      ]}
      onPress={() => setSelectedType(type.id)}
    >
      <View style={styles.typeHeader}>
        <Text style={styles.typeIcon}>{type.icon}</Text>
        <View style={styles.typeContent}>
          <Text style={styles.typeTitle}>{type.title}</Text>
          <Text style={styles.typeDescription}>{type.description}</Text>
        </View>
        <View style={styles.radioButton}>
          <View style={[
            styles.radioOuter,
            selectedType === type.id && { borderColor: type.color }
          ]}>
            {selectedType === type.id && (
              <View style={[styles.radioInner, { backgroundColor: type.color }]} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeedbackHistoryItem = ({ item }: { item: FeedbackSubmission }) => {
    const feedbackType = feedbackTypes.find(type => type.id === item.type);

    return (
      <Card style={styles.historyItem} padding={16}>
        <View style={styles.historyHeader}>
          <View style={styles.historyType}>
            <Text style={styles.historyIcon}>{feedbackType?.icon || '📝'}</Text>
            <View style={styles.historyInfo}>
              <Text style={styles.historySubject}>{item.subject}</Text>
              <Text style={styles.historyDate}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recently'}
              </Text>
            </View>
          </View>
          <View style={styles.historyStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'resolved' ? '#34c759' : item.status === 'reviewed' ? '#007aff' : '#ff9500' }
            ]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>

        <Text style={styles.historyMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </Card>
    );
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color="#34c759" />
          <Text style={styles.successTitle}>Feedback Submitted!</Text>
          <Text style={styles.successMessage}>
            Thank you for your feedback. We appreciate you helping us improve Givta!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Share Your Feedback</Text>
        <Text style={styles.headerSubtitle}>
          Help us improve Givta by sharing your thoughts, reporting issues, or suggesting new features.
        </Text>
      </View>

      {/* Feedback Types */}
      <Card style={styles.section} padding={20} margin={16}>
        <Text style={styles.sectionTitle}>What type of feedback do you have?</Text>
        <View style={styles.feedbackTypesContainer}>
          {feedbackTypes.map(renderFeedbackType)}
        </View>
      </Card>

      {/* Quick Suggestions for "Other" Type */}
      {selectedType === 'other' && (
        <Card style={styles.section} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>💡 Quick Suggestions</Text>
          <Text style={styles.suggestionsSubtitle}>
            Here are some common areas where users often suggest improvements:
          </Text>

          <View style={styles.suggestionsGrid}>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('Navigation & User Flow');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>Navigation & User Flow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('App Performance & Speed');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>App Performance & Speed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('New Features Request');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>New Features Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('User Interface Design');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>User Interface Design</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('Payment & Transactions');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>Payment & Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('Notifications & Alerts');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>Notifications & Alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('Security & Privacy');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>Security & Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => {
                setSubject('Customer Support');
                setShowQuickSuggestions(false);
              }}
            >
              <Text style={styles.suggestionText}>Customer Support</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setShowQuickSuggestions(false)}
          >
            <Text style={styles.skipButtonText}>Skip suggestions, I'll write my own</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Rating */}
      {selectedType && selectedType !== 'other' && (
        <Card style={styles.section} padding={20} margin={16}>
          {renderStarRating()}
        </Card>
      )}

      {/* Rating for "Other" type - shown after suggestions */}
      {selectedType === 'other' && !showQuickSuggestions && (
        <Card style={styles.section} padding={20} margin={16}>
          {renderStarRating()}
        </Card>
      )}

      {/* Feedback Form */}
      {selectedType && rating > 0 && (
        <Card style={styles.section} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Tell us more</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subject *</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief summary of your feedback"
              placeholderTextColor="#8e8e93"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide detailed information about your feedback, including steps to reproduce any issues..."
              placeholderTextColor="#8e8e93"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>{message.length}/1000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitFeedback}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Feedback Guidelines */}
      <Card style={styles.section} padding={20} margin={16}>
        <Text style={styles.sectionTitle}>📋 Feedback Guidelines</Text>

        <View style={styles.guidelinesList}>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34c759" />
            <Text style={styles.guidelineText}>Be specific and provide details</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34c759" />
            <Text style={styles.guidelineText}>Include steps to reproduce bugs</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34c759" />
            <Text style={styles.guidelineText}>Suggest specific improvements for features</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34c759" />
            <Text style={styles.guidelineText}>Keep feedback constructive and respectful</Text>
          </View>
        </View>
      </Card>

      {/* Feedback History */}
      {submittedFeedback.length > 0 && (
        <Card style={styles.section} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>📚 Your Feedback History</Text>
          <FlatList
            data={submittedFeedback}
            renderItem={renderFeedbackHistoryItem}
            keyExtractor={(item) => item.id || ''}
            ItemSeparatorComponent={() => <View style={styles.historySeparator} />}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </Card>
      )}

      {/* Contact Info */}
      <Card style={styles.section} padding={20} margin={16}>
        <Text style={styles.sectionTitle}>📧 Need Immediate Help?</Text>
        <Text style={styles.contactText}>
          For urgent issues or questions, you can also reach us at:
        </Text>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail" size={20} color="#4B0082" />
          <Text style={styles.contactButtonText}>support@givta.ng or +234 813 927 0820</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  feedbackTypesContainer: {
    gap: 12,
  },
  feedbackTypeCard: {
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: '#8e8e93',
  },
  radioButton: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8e8e93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1c1c1e',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4B0082',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#8e8e93',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guidelinesList: {
    gap: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidelineText: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 8,
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historySubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  historyStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyMessage: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  historySeparator: {
    height: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 16,
    color: '#4B0082',
    marginLeft: 8,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  successContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: '#4B008220',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B008240',
  },
  suggestionText: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '500',
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    textDecorationLine: 'underline',
  },
});

export default FeedbackScreen;
