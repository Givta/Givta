import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: January 15, 2025</Text>
        </View>

        {/* Introduction */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            At Givta, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </Text>
        </Card>

        {/* Information We Collect */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly and automatically when using Givta:{'\n'}
            • Personal Information: Full name, email address, phone number, username, referral code, date of birth{'\n'}
            • Financial Information: Bank account details, BVN, transaction history, wallet balance, KYC documents{'\n'}
            • Device & Technical Data: Device model, operating system, app version, IP address, Firebase tokens{'\n'}
            • Usage Analytics: Tipping patterns, money transfer activity, feature usage, session duration{'\n'}
            • Location Data: Approximate location for fraud prevention and regional service availability{'\n'}
            • Communication Data: Customer support interactions, feedback submissions{'\n'}
            • Biometric Data: Fingerprint or facial recognition data (stored securely on device only)
          </Text>
        </Card>

        {/* How We Use Your Information */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information for the following purposes:{'\n'}
            • Transaction Processing: Execute money transfers, tips, deposits, withdrawals, and wallet operations{'\n'}
            • Account Management: Create and maintain user accounts, process KYC verification, manage security settings{'\n'}
            • Customer Support: Respond to inquiries, resolve disputes, provide technical assistance{'\n'}
            • Communications: Send transaction confirmations, security alerts, service updates, and marketing materials{'\n'}
            • Fraud Prevention: Analyze transaction patterns, detect suspicious activities, comply with anti-money laundering regulations{'\n'}
            • Analytics: Generate insights into user behavior, improve app performance, develop new features{'\n'}
            • Referral Program: Track referral relationships, calculate bonuses, process reward payments{'\n'}
            • Legal Compliance: Meet regulatory requirements, respond to legal requests, enforce our terms of service
          </Text>
        </Card>

        {/* Information Sharing */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:{'\n'}
            • With your explicit consent{'\n'}
            • To comply with legal obligations{'\n'}
            • To protect our rights and prevent fraud{'\n'}
            • With trusted service providers who assist our operations{'\n'}
            • In connection with a business transfer or acquisition
          </Text>
        </Card>

        {/* Data Security */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your data:{'\n'}
            • End-to-end encryption for sensitive information{'\n'}
            • Secure servers with regular security audits{'\n'}
            • Multi-factor authentication options{'\n'}
            • Regular security updates and patches{'\n'}
            • Employee access controls and training
          </Text>
        </Card>

        {/* Your Rights */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:{'\n'}
            • Access and review your personal information{'\n'}
            • Correct inaccurate or incomplete data{'\n'}
            • Request deletion of your personal information{'\n'}
            • Object to or restrict certain processing{'\n'}
            • Data portability (receive your data in a structured format){'\n'}
            • Withdraw consent for marketing communications
          </Text>
        </Card>

        {/* Cookies and Tracking */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>7. Cookies and Tracking</Text>
          <Text style={styles.paragraph}>
            We use cookies and similar technologies to enhance your experience:{'\n'}
            • Essential cookies for app functionality{'\n'}
            • Analytics cookies to understand usage patterns{'\n'}
            • Preference cookies to remember your settings{'\n'}
            • You can control cookie preferences in your device settings
          </Text>
        </Card>

        {/* Third-Party Services */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            Our app may integrate with third-party services:{'\n'}
            • Payment processors (Paystack, banks){'\n'}
            • Analytics providers{'\n'}
            • Customer support tools{'\n'}
            • Cloud storage services{'\n'}
            Each third party has their own privacy policies
          </Text>
        </Card>

        {/* Children's Privacy */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it immediately.
          </Text>
        </Card>

        {/* Changes to Privacy Policy */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>10. Changes to Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes your acceptance of the new Privacy Policy.
          </Text>
        </Card>

        {/* Contact Us */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:{'\n'}
            Email: privacy@givta.app{'\n'}
            Phone: +234 813 927 0820{'\n'}
            Address: Lagos, Nigeria{'\n'}
            Data Protection Officer: dpo@givta.app
          </Text>
        </Card>

        {/* Data Subject Rights */}
        <Card style={styles.highlightCard} padding={20} margin={16}>
          <Text style={styles.highlightTitle}>📋 Exercise Your Data Rights</Text>
          <Text style={styles.highlightText}>
            To exercise any of your data protection rights, please contact our Data Protection Officer at dpo@givta.app with your request. We will respond within 30 days.
          </Text>
        </Card>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Contact Privacy Team"
            onPress={() => {/* Handle contact */}}
            style={styles.contactButton}
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
  highlightCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 16,
  },
  contactButton: {
    backgroundColor: '#4B0082',
  },
});
