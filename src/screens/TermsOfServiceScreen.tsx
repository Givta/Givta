import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const TermsOfServiceScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Last updated: January 15, 2025</Text>
        </View>

        {/* Introduction */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to Givta! These Terms of Service ("Terms") govern your use of the Givta mobile application and services provided by Givta Technologies. By using our app, you agree to these terms.
          </Text>
        </Card>

        {/* Acceptance of Terms */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Givta, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </Card>

        {/* User Accounts */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            • You must be at least 18 years old to use our services{'\n'}
            • You are responsible for maintaining the confidentiality of your account{'\n'}
            • You must provide accurate and complete information{'\n'}
            • You are responsible for all activities under your account
          </Text>
        </Card>

        {/* Services */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>4. Services</Text>
          <Text style={styles.paragraph}>
            Givta provides financial services including wallet management, money transfers, tipping, and referral programs. All services are subject to availability and may change without notice.
          </Text>
        </Card>

        {/* Fees and Payments */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>5. Fees and Payments</Text>
          <Text style={styles.paragraph}>
            • Transaction fees are clearly displayed before confirmation{'\n'}
            • All fees are non-refundable once a transaction is processed{'\n'}
            • We reserve the right to change fees with 30 days notice{'\n'}
            • Payment methods are subject to their own terms and conditions
          </Text>
        </Card>

        {/* Prohibited Activities */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.paragraph}>
            You agree not to:{'\n'}
            • Use the service for illegal activities{'\n'}
            • Attempt to hack or compromise the system{'\n'}
            • Share your account credentials with others{'\n'}
            • Use automated tools to access the service{'\n'}
            • Transmit harmful or malicious content
          </Text>
        </Card>

        {/* Privacy */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>7. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of Givta, to understand our practices.
          </Text>
        </Card>

        {/* Termination */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </Text>
        </Card>

        {/* Limitation of Liability */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            In no event shall Givta Technologies, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
          </Text>
        </Card>

        {/* Changes to Terms */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </Text>
        </Card>

        {/* Contact Information */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:{'\n'}
            Email: legal@givta.com{'\n'}
            Phone: +234 123 456 7890{'\n'}
            Address: Lagos, Nigeria
          </Text>
        </Card>

        {/* Agreement */}
        <Card style={styles.agreementCard} padding={20} margin={16}>
          <Text style={styles.agreementText}>
            By using Givta, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </Card>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="I Agree to Terms"
            onPress={() => {/* Handle agreement */}}
            style={styles.agreeButton}
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
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 24,
  },
  agreementCard: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#4B0082',
  },
  agreementText: {
    fontSize: 16,
    color: '#4B0082',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 16,
  },
  agreeButton: {
    backgroundColor: '#4B0082',
  },
});
