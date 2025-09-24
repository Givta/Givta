import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const HelpSupportScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
        const email = 'support@givta.com';
        const subject = 'Givta App Support Request';
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'Call Support',
      icon: '📞',
      action: () => {
        const phoneNumber = '+2341234567890';
        Linking.openURL(`tel:${phoneNumber}`);
      },
    },
    {
      title: 'WhatsApp Support',
      icon: '💬',
      action: () => {
        const phoneNumber = '+2341234567890';
        const message = 'Hi, I need help with the Givta app';
        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'FAQ',
      icon: '❓',
      action: () => {
        Alert.alert('FAQ', 'Frequently Asked Questions will be available soon!');
      },
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
                <Text style={styles.contactValue}>support@givta.com</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📞</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+234 123 456 7890</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>💬</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>+234 123 456 7890</Text>
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
            For urgent security issues or account emergencies, contact us immediately at emergency@givta.com or call +234 123 456 7890.
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
});
