import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Alert, FlatList, RefreshControl, Modal, TouchableOpacity, TextInput, Clipboard, Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface ReferralLevel {
  level: number;
  bonus: number;
  count: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  joinedDate: Date;
  level: number;
  earnings: number;
}

export const ReferralScreen: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([
    { level: 1, bonus: 100, count: 0, totalEarned: 0 },
    { level: 2, bonus: 50, count: 0, totalEarned: 0 },
    { level: 3, bonus: 25, count: 0, totalEarned: 0 },
  ]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calculatorModalVisible, setCalculatorModalVisible] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    level1: '0',
    level2: '0',
    level3: '0',
  });
  const [calculatedEarnings, setCalculatedEarnings] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
    total: 0,
  });
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankCode: '',
    accountName: '',
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalRequirements, setWithdrawalRequirements] = useState<{
    totalReferrals: number;
    activeReferrals: number;
    activePercentage: number;
    requiredPercentage: number;
    canWithdraw: boolean;
  } | null>(null);

  // New advanced features state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [sharingModalVisible, setSharingModalVisible] = useState(false);
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [supportData, setSupportData] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [selectedSharingOption, setSelectedSharingOption] = useState<string>('');

  // 3-tier referral system as specified
  const [extendedReferralLevels, setExtendedReferralLevels] = useState([
    { level: 1, bonus: 100, count: 0, totalEarned: 0, description: 'Friend joins' },
    { level: 2, bonus: 50, count: 0, totalEarned: 0, description: 'Friend becomes active' },
    { level: 3, bonus: 25, count: 0, totalEarned: 0, description: 'Long-term engagement' },
  ]);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) {
      console.log('No user found, skipping referral data load');
      return;
    }

    console.log('Loading referral data for user:', user.id);

    try {
      setLoading(true);

      // Get referral stats from backend
      const statsResponse = await apiService.getReferralStats();
      console.log('Referral stats response:', statsResponse);

      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data;
        console.log('Referral stats data:', stats);

        // Check if levelStats exists and is an array
        if (stats.levelStats && Array.isArray(stats.levelStats)) {
          // Update referral levels with real data
          setReferralLevels([
            {
              level: 1,
              bonus: 100, // $1 bonus for level 1
              count: stats.levelStats.find(l => l.level === 1)?.count || 0,
              totalEarned: stats.levelStats.find(l => l.level === 1)?.earnings || 0,
            },
            {
              level: 2,
              bonus: 50, // $0.50 bonus for level 2
              count: stats.levelStats.find(l => l.level === 2)?.count || 0,
              totalEarned: stats.levelStats.find(l => l.level === 2)?.earnings || 0,
            },
            {
              level: 3,
              bonus: 25, // $0.25 bonus for level 3
              count: stats.levelStats.find(l => l.level === 3)?.count || 0,
              totalEarned: stats.levelStats.find(l => l.level === 3)?.earnings || 0,
            },
          ]);

          setTotalEarnings(stats.totalEarnings || 0);
        } else {
          console.warn('levelStats is not available or not an array:', stats.levelStats);
          // Keep default values
        }
      } else {
        console.error('Failed to get referral stats:', statsResponse.error);
        // Keep default values
      }

      // Get referral code from user document (should match what's in Firestore)
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.referralCode) {
          setReferralCode(userData.referralCode);
        } else {
          // Fallback to user ID if no referral code in document
          setReferralCode(user.id.substring(0, 8).toUpperCase());
        }
      } else {
        // Fallback to user ID if document doesn't exist
        setReferralCode(user.id.substring(0, 8).toUpperCase());
      }

      // Get referrals list
      const referralsResponse = await apiService.getReferrals();
      if (referralsResponse.success && referralsResponse.data) {
        const formattedReferrals = referralsResponse.data.map(ref => ({
          id: ref.id,
          name: ref.referredId, // This should be the referred user's name
          email: '', // Email not available in referral data
          joinedDate: new Date(ref.createdAt),
          level: ref.level,
          earnings: ref.bonus,
        }));
        setReferrals(formattedReferrals);
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  const shareReferralCode = async () => {
    try {
      const appStoreUrl = 'https://apps.apple.com/app/givta';
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.givta.app';
      const webUrl = `https://givta.app/referral/${referralCode}`;

      const message = `🎁 Join Givta and earn money together!\n\nUse my referral code: ${referralCode}\n\nDownload the app:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n🌐 Web: ${webUrl}\n\n#Givta #Referral #EarnMoney`;

      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const updateCalculatorInput = (level: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    const numValue = parseInt(numericValue) || 0;

    setCalculatorInputs(prev => ({
      ...prev,
      [level]: numericValue,
    }));

    // Calculate earnings
    const level1Earnings = level === 'level1' ? numValue * 100 : (parseInt(calculatorInputs.level1) || 0) * 100;
    const level2Earnings = level === 'level2' ? numValue * 50 : (parseInt(calculatorInputs.level2) || 0) * 50;
    const level3Earnings = level === 'level3' ? numValue * 25 : (parseInt(calculatorInputs.level3) || 0) * 25;

    setCalculatedEarnings({
      level1: level1Earnings,
      level2: level2Earnings,
      level3: level3Earnings,
      total: level1Earnings + level2Earnings + level3Earnings,
    });
  };

  const resetCalculator = () => {
    setCalculatorInputs({
      level1: '0',
      level2: '0',
      level3: '0',
    });
    setCalculatedEarnings({
      level1: 0,
      level2: 0,
      level3: 0,
      total: 0,
    });
  };

  // New advanced features functions
  const loadReferralHistory = async () => {
    try {
      const response = await apiService.getReferralHistory();
      if (response.success && response.data) {
        setReferralHistory(response.data.activities);
      }
    } catch (error) {
      console.error('Error loading referral history:', error);
    }
  };

  const loadReferralSupport = async () => {
    try {
      const response = await apiService.getReferralSupport();
      if (response.success && response.data) {
        setSupportData(response.data);
      }
    } catch (error) {
      console.error('Error loading referral support:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await apiService.generateReferralQR();
      if (response.success && response.data) {
        setQrCodeData(response.data.qrData);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const openHistoryModal = async () => {
    await loadReferralHistory();
    setHistoryModalVisible(true);
  };

  const openSupportModal = async () => {
    await loadReferralSupport();
    setSupportModalVisible(true);
  };

  const openSharingModal = async () => {
    await generateQRCode();
    setSharingModalVisible(true);
  };

  const shareViaPlatform = async (platform: string) => {
    const appStoreUrl = 'https://apps.apple.com/app/givta';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.givta.app';
    const webUrl = `https://givta.app/referral/${referralCode}`;

    // Givta description and value proposition
    const givtaDescription = `💰 Givta is a revolutionary social payment & tipping app that lets you earn money by sharing, tipping, and referring friends!\n\n✨ Features:\n• Send & receive instant tips\n• Earn from referrals\n• Social payment network\n• Secure & fast transactions\n• Build your income stream\n\n🎯 Join now and start earning!`;

    let message = '';

    switch (platform) {
      case 'whatsapp':
        message = `${givtaDescription}\n\n🎁 Use my referral code: ${referralCode}\n\nDownload Givta now:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n🌐 Web: ${webUrl}\n\n#Givta #EarnMoney #SocialPayments #Referral`;
        break;
      case 'instagram':
        message = `${givtaDescription}\n\n🎁 Use my referral code: ${referralCode}\n\nDownload Givta:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n\n#Givta #EarnMoney #SocialPayments`;
        break;
      case 'twitter':
        message = `${givtaDescription}\n\n🚀 Use code ${referralCode} for referral bonuses!\n\nDownload Givta:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n\n#Givta #EarnMoney #SocialPayments #Referral`;
        break;
      case 'email':
        message = `Hi!\n\n${givtaDescription}\n\n🎁 Use my referral code: ${referralCode}\n\nDownload Givta:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n🌐 Web: ${webUrl}\n\nStart earning money today!\n\n#Givta #EarnMoney #SocialPayments`;
        break;
      default:
        message = `${givtaDescription}\n\n🎁 Use my referral code: ${referralCode}\n\nDownload Givta:\n📱 iOS: ${appStoreUrl}\n🤖 Android: ${playStoreUrl}\n🌐 Web: ${webUrl}`;
    }

    try {
      await Share.share({
        message,
        url: webUrl,
      });
      setSelectedSharingOption(platform);
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const contactSupport = (method: string) => {
    if (!supportData) return;

    switch (method) {
      case 'email':
        Linking.openURL(`mailto:${supportData.contact.email}?subject=Referral Support`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${supportData.contact.whatsapp.replace('+', '')}`);
        break;
      default:
        Alert.alert('Contact Info', `Email: ${supportData.contact.email}\nWhatsApp: ${supportData.contact.whatsapp}\nHours: ${supportData.contact.hours}`);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseInt(withdrawalAmount);
    if (!amount || amount < 1500) {
      Alert.alert('Error', 'Minimum withdrawal amount is ₦1,500');
      return;
    }

    if (amount > totalEarnings) {
      Alert.alert('Error', 'Insufficient referral earnings');
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.bankCode || !bankDetails.accountName) {
      Alert.alert('Error', 'Please fill in all bank details');
      return;
    }

    try {
      setWithdrawing(true);

      const response = await apiService.withdrawReferralEarnings(amount, bankDetails);

      if (response.success) {
        Alert.alert(
          'Success',
          `Withdrawal request submitted successfully!\n\nAmount: ${formatCurrency(amount)}\nFee: ${formatCurrency(amount * 0.04)}\nNet Amount: ${formatCurrency(amount - (amount * 0.04))}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setWithdrawalModalVisible(false);
                setWithdrawalAmount('');
                setBankDetails({
                  accountNumber: '',
                  bankCode: '',
                  accountName: '',
                });
                // Refresh data to show updated balance
                loadReferralData();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const renderReferralLevel = ({ item }: { item: ReferralLevel }) => (
    <Card style={styles.levelCard} padding={16} margin={8}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelTitle}>Level {item.level}</Text>
        <Text style={styles.levelBonus}>{formatCurrency(item.bonus)} bonus</Text>
      </View>
      <View style={styles.levelStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.count}</Text>
          <Text style={styles.statLabel}>Referrals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(item.totalEarned)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>
    </Card>
  );

  const renderReferral = ({ item }: { item: Referral }) => (
    <Card style={styles.referralCard} padding={12} margin={4}>
      <View style={styles.referralRow}>
        <View style={styles.referralInfo}>
          <Text style={styles.referralName}>{item.name}</Text>
          <Text style={styles.referralEmail}>{item.email}</Text>
          <Text style={styles.referralDate}>{formatDate(item.joinedDate)}</Text>
        </View>
        <View style={styles.referralEarnings}>
          <Text style={styles.referralEarningsAmount}>{formatCurrency(item.earnings)}</Text>
          <Text style={styles.earningsLevel}>Level {item.level}</Text>
        </View>
      </View>
    </Card>
  );

  const renderExtendedLevel = ({ item }: { item: any }) => (
    <Card style={styles.extendedLevelCard} padding={12} margin={4}>
      <View style={styles.extendedLevelHeader}>
        <Text style={styles.extendedLevelNumber}>{item.level}</Text>
        <Text style={styles.extendedLevelBonus}>{formatCurrency(item.bonus)}</Text>
      </View>
      <Text style={styles.extendedLevelDescription}>{item.description}</Text>
    </Card>
  );

  const renderHistoryItem = ({ item }: { item: any }) => (
    <Card style={styles.historyCard} padding={12} margin={4}>
      <View style={styles.historyRow}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyType}>
            {item.type === 'referral_joined' ? '🎉 New Referral' :
             item.type === 'referral_active' ? '🚀 Referral Active' :
             item.type}
          </Text>
          <Text style={styles.historyUser}>{item.userName}</Text>
          <Text style={styles.historyDate}>{formatDate(new Date(item.date))}</Text>
        </View>
        <View style={styles.historyEarnings}>
          <Text style={styles.historyAmount}>{formatCurrency(item.bonus)}</Text>
          <Text style={styles.historyLevel}>Level {item.level}</Text>
        </View>
      </View>
    </Card>
  );

  const renderSupportItem = ({ item }: { item: any }) => (
    <Card style={styles.supportCard} padding={16} margin={8}>
      <Text style={styles.supportQuestion}>{item.question}</Text>
      <Text style={styles.supportAnswer}>{item.answer}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.content}>
        {/* Referral Code Card */}
        <Card style={styles.codeCard} padding={20} margin={16}>
          <Text style={styles.codeTitle}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{referralCode}</Text>
          <Text style={styles.codeDescription}>
            💰 Givta is a revolutionary social payment & tipping app that lets you earn money by sharing, tipping, and referring friends!
          </Text>
          <Text style={styles.codeSubDescription}>
            ✨ Send & receive instant tips • Earn from referrals • Build your income stream
          </Text>
          <Text style={styles.codeSubDescription}>
            🎯 Share this code with friends and earn bonuses when they join!
          </Text>
          <Button
            title="Share Code"
            onPress={shareReferralCode}
            style={styles.shareButton}
          />
        </Card>

        {/* Earnings Summary */}
        <Card style={styles.earningsCard} padding={16} margin={16}>
          <Text style={styles.earningsTitle}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>{formatCurrency(totalEarnings)}</Text>

          {/* Withdrawal Requirements Info */}
          {totalEarnings >= 1500 && (
            <View style={styles.requirementsInfo}>
              <Text style={styles.requirementsText}>
                📋 Withdrawal Requirements:
              </Text>
              <Text style={styles.requirementsDetail}>
                • Minimum: {formatCurrency(1500)}
              </Text>
              <Text style={styles.requirementsDetail}>
                • 40% of referrals must be active
              </Text>
            </View>
          )}

          {totalEarnings >= 1500 && (
            <Button
              title="Withdraw Earnings"
              onPress={() => setWithdrawalModalVisible(true)}
              style={styles.withdrawButton}
              size="small"
            />
          )}

          {totalEarnings < 1500 && (
            <Text style={styles.minimumText}>
              Minimum withdrawal: {formatCurrency(1500)}
            </Text>
          )}
        </Card>

        {/* Advanced Features Row */}
        <View style={styles.featuresRow}>
          <Card style={styles.featureCard} padding={16} margin={8}>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={() => setCalculatorModalVisible(true)}
            >
              <Ionicons name="calculator" size={24} color="#4B0082" />
              <Text style={styles.featureTitle}>Calculator</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.featureCard} padding={16} margin={8}>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={openHistoryModal}
            >
              <Ionicons name="time-outline" size={24} color="#4B0082" />
              <Text style={styles.featureTitle}>History</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.featureCard} padding={16} margin={8}>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={openSharingModal}
            >
              <Ionicons name="share-social-outline" size={24} color="#4B0082" />
              <Text style={styles.featureTitle}>Share</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.featureCard} padding={16} margin={8}>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={openSupportModal}
            >
              <Ionicons name="help-circle-outline" size={24} color="#4B0082" />
              <Text style={styles.featureTitle}>Help</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Multi-Level Referral System */}
        <Card style={styles.multiLevelCard} padding={20} margin={16}>
          <Text style={styles.multiLevelTitle}>🌐 Multi-Level Referral System</Text>
          <Text style={styles.multiLevelSubtitle}>
            Earn bonuses from your referrals at 3 different levels!
          </Text>

          <FlatList
            data={extendedReferralLevels}
            renderItem={renderExtendedLevel}
            keyExtractor={(item) => item.level.toString()}
            scrollEnabled={false}
            numColumns={2}
            contentContainerStyle={styles.multiLevelGrid}
          />

          <Text style={styles.multiLevelNote}>
            💡 Network bonuses help you build a sustainable income stream
          </Text>
        </Card>

        {/* Referral Levels */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Referral Levels</Text>
          <FlatList
            data={referralLevels}
            renderItem={renderReferralLevel}
            keyExtractor={(item) => item.level.toString()}
            scrollEnabled={false}
            numColumns={1}
          />
        </View>

        {/* How It Works Instructions */}
        <Card style={styles.instructionsCard} padding={20} margin={16}>
          <Text style={styles.instructionsTitle}>🎯 How Referral System Works</Text>

          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Share your unique referral code with friends, family, or on social media
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>
                When someone uses your code during registration, they become your referral
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Bonuses</Text>
              <Text style={styles.stepDescription}>
                You earn bonuses based on their activity level (Level 1, 2, or 3)
              </Text>
            </View>
          </View>

          <View style={styles.bonusInfo}>
            <Text style={styles.bonusTitle}>💰 Bonus Structure:</Text>
            <Text style={styles.bonusText}>• Level 1: ₦100 when friend joins</Text>
            <Text style={styles.bonusText}>• Level 2: ₦50 when friend becomes active</Text>
            <Text style={styles.bonusText}>• Level 3: ₦25 for long-term engagement</Text>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
            <Text style={styles.tipsText}>• Share on multiple social platforms</Text>
            <Text style={styles.tipsText}>• Include your code in bios and posts</Text>
            <Text style={styles.tipsText}>• Ask friends to spread the word too</Text>
            <Text style={styles.tipsText}>• Check back regularly for new referrals</Text>
          </View>
        </Card>

        {/* Recent Referrals */}
        <View style={styles.referralsSection}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.length > 0 ? (
            <FlatList
              data={referrals}
              renderItem={renderReferral}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard} padding={20} margin={16}>
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>
                Share your referral code to start earning bonuses!
              </Text>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>

    <Modal
      visible={calculatorModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setCalculatorModalVisible(false)}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🧮 Earnings Calculator</Text>
          <Text style={styles.modalSubtitle}>
            Calculate your potential earnings from referrals
          </Text>
        </View>

        <View style={styles.modalContent}>
          {/* Input Section */}
          <Card style={styles.calculatorInputsCard} padding={20} margin={16}>
            <Text style={styles.calculatorInputsTitle}>Enter Referral Numbers</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Level 1 Referrals:</Text>
              <TextInput
                style={styles.inputField}
                value={calculatorInputs.level1}
                onChangeText={(value) => updateCalculatorInput('level1', value)}
                keyboardType="numeric"
                placeholder="0"
                maxLength={3}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Level 2 Referrals:</Text>
              <TextInput
                style={styles.inputField}
                value={calculatorInputs.level2}
                onChangeText={(value) => updateCalculatorInput('level2', value)}
                keyboardType="numeric"
                placeholder="0"
                maxLength={3}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Level 3 Referrals:</Text>
              <TextInput
                style={styles.inputField}
                value={calculatorInputs.level3}
                onChangeText={(value) => updateCalculatorInput('level3', value)}
                keyboardType="numeric"
                placeholder="0"
                maxLength={3}
              />
            </View>

            <Button
              title="Reset Calculator"
              onPress={resetCalculator}
              variant="outline"
              style={styles.resetButton}
            />
          </Card>

          {/* Results Section */}
          <Card style={styles.resultsCard} padding={20} margin={16}>
            <Text style={styles.resultsTitle}>💰 Potential Earnings</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Level 1 Earnings:</Text>
              <Text style={styles.resultValue}>{formatCurrency(calculatedEarnings.level1)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Level 2 Earnings:</Text>
              <Text style={styles.resultValue}>{formatCurrency(calculatedEarnings.level2)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Level 3 Earnings:</Text>
              <Text style={styles.resultValue}>{formatCurrency(calculatedEarnings.level3)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Potential Earnings:</Text>
              <Text style={styles.totalValue}>{formatCurrency(calculatedEarnings.total)}</Text>
            </View>
          </Card>

          {/* Bonus Information */}
          <Card style={styles.bonusCard} padding={20} margin={16}>
            <Text style={styles.bonusCardTitle}>💡 Remember:</Text>
            <Text style={styles.bonusCardText}>
              • Level 1: ₦100 per referral when friend joins{'\n'}
              • Level 2: ₦50 per referral when friend becomes active{'\n'}
              • Level 3: ₦25 per referral for long-term engagement{'\n'}
              • Earnings are credited instantly to your wallet
            </Text>
          </Card>

          {/* Close Button */}
          <View style={styles.modalCloseContainer}>
            <Button
              title="Close Calculator"
              onPress={() => setCalculatorModalVisible(false)}
              variant="outline"
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>

    {/* Withdrawal Modal */}
    <Modal
      visible={withdrawalModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setWithdrawalModalVisible(false)}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>💰 Withdraw Referral Earnings</Text>
          <Text style={styles.modalSubtitle}>
            Withdraw your referral earnings to your bank account
          </Text>
        </View>

        <View style={styles.modalContent}>
          {/* Withdrawal Amount */}
          <Card style={styles.withdrawalAmountCard} padding={20} margin={16}>
            <Text style={styles.withdrawalAmountTitle}>Withdrawal Amount</Text>
            <Text style={styles.availableBalance}>
              Available: {formatCurrency(totalEarnings)}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={withdrawalAmount}
              onChangeText={(value) => {
                // Only allow numbers
                const numericValue = value.replace(/[^0-9]/g, '');
                setWithdrawalAmount(numericValue);
              }}
              keyboardType="numeric"
              placeholder="Enter amount (min ₦1,500)"
              maxLength={7}
            />
            {withdrawalAmount && parseInt(withdrawalAmount) > 0 && (
              <View style={styles.feeBreakdown}>
                <Text style={styles.feeText}>
                  Amount: {formatCurrency(parseInt(withdrawalAmount))}
                </Text>
                <Text style={styles.feeText}>
                  Fee (4%): {formatCurrency(parseInt(withdrawalAmount) * 0.04)}
                </Text>
                <Text style={styles.netAmount}>
                  You'll receive: {formatCurrency(parseInt(withdrawalAmount) - (parseInt(withdrawalAmount) * 0.04))}
                </Text>
              </View>
            )}
          </Card>

          {/* Bank Details */}
          <Card style={styles.bankDetailsCard} padding={20} margin={16}>
            <Text style={styles.bankDetailsTitle}>Bank Account Details</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Account Number:</Text>
              <TextInput
                style={styles.accountInput}
                value={bankDetails.accountNumber}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, accountNumber: value.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                placeholder="1234567890"
                maxLength={10}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Bank Code:</Text>
              <TextInput
                style={styles.bankCodeInput}
                value={bankDetails.bankCode}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, bankCode: value.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                placeholder="044"
                maxLength={3}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Account Name:</Text>
              <TextInput
                style={styles.accountNameInput}
                value={bankDetails.accountName}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, accountName: value }))}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </View>
          </Card>

          {/* Withdrawal Button */}
          <View style={styles.withdrawalButtonContainer}>
            <Button
              title={withdrawing ? "Processing..." : "Withdraw Earnings"}
              onPress={handleWithdrawal}
              style={styles.withdrawalSubmitButton}
              disabled={withdrawing || !withdrawalAmount || parseInt(withdrawalAmount) < 1500}
            />
          </View>

          {/* Close Button */}
          <View style={styles.modalCloseContainer}>
            <Button
              title="Cancel"
              onPress={() => setWithdrawalModalVisible(false)}
              variant="outline"
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>

    {/* History Modal */}
    <Modal
      visible={historyModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setHistoryModalVisible(false)}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📊 Referral History</Text>
          <Text style={styles.modalSubtitle}>
            Track all your referral activities and earnings
          </Text>
        </View>

        <View style={styles.modalContent}>
          {referralHistory.length > 0 ? (
            <FlatList
              data={referralHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard} padding={20} margin={16}>
              <Text style={styles.emptyText}>No referral history yet</Text>
              <Text style={styles.emptySubtext}>
                Your referral activities will appear here
              </Text>
            </Card>
          )}

          <View style={styles.modalCloseContainer}>
            <Button
              title="Close History"
              onPress={() => setHistoryModalVisible(false)}
              variant="outline"
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>

    {/* Support Modal */}
    <Modal
      visible={supportModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSupportModalVisible(false)}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>❓ Referral Support</Text>
          <Text style={styles.modalSubtitle}>
            Get help with your referral questions
          </Text>
        </View>

        <View style={styles.modalContent}>
          {supportData?.faq && (
            <FlatList
              data={supportData.faq}
              renderItem={renderSupportItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          )}

          {supportData?.contact && (
            <Card style={styles.supportCard} padding={20} margin={16}>
              <Text style={styles.supportQuestion}>📞 Contact Support</Text>
              <Text style={styles.supportAnswer}>
                Email: {supportData.contact.email}{'\n'}
                WhatsApp: {supportData.contact.whatsapp}{'\n'}
                Hours: {supportData.contact.hours}
              </Text>

              <View style={styles.contactButtons}>
                <Button
                  title="Email Support"
                  onPress={() => contactSupport('email')}
                  style={styles.contactButton}
                />
                <Button
                  title="WhatsApp Support"
                  onPress={() => contactSupport('whatsapp')}
                  variant="outline"
                  style={styles.contactButton}
                />
              </View>
            </Card>
          )}

          <View style={styles.modalCloseContainer}>
            <Button
              title="Close Support"
              onPress={() => setSupportModalVisible(false)}
              variant="outline"
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>

    {/* Sharing Modal */}
    <Modal
      visible={sharingModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSharingModalVisible(false)}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📤 Share Referral Code</Text>
          <Text style={styles.modalSubtitle}>
            Choose how you want to share your referral code
          </Text>
        </View>

        <View style={styles.modalContent}>
          {/* QR Code */}
          {qrCodeData && (
            <Card style={styles.qrCard} padding={20} margin={16}>
              <Text style={styles.qrTitle}>📱 QR Code</Text>
              <Text style={styles.qrSubtitle}>Scan to join with your code</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrCodeData}
                  size={200}
                  color="#4B0082"
                  backgroundColor="#fff"
                />
              </View>
            </Card>
          )}

          {/* Sharing Options */}
          <Card style={styles.sharingOptionsCard} padding={20} margin={16}>
            <Text style={styles.sharingTitle}>Choose Platform</Text>

            <View style={styles.sharingButtons}>
              <TouchableOpacity
                style={styles.sharingButton}
                onPress={() => shareViaPlatform('whatsapp')}
              >
                <Text style={styles.sharingIcon}>💬</Text>
                <Text style={styles.sharingText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharingButton}
                onPress={() => shareViaPlatform('instagram')}
              >
                <Text style={styles.sharingIcon}>📸</Text>
                <Text style={styles.sharingText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharingButton}
                onPress={() => shareViaPlatform('twitter')}
              >
                <Text style={styles.sharingIcon}>🐦</Text>
                <Text style={styles.sharingText}>Twitter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sharingButton}
                onPress={() => shareViaPlatform('email')}
              >
                <Text style={styles.sharingIcon}>📧</Text>
                <Text style={styles.sharingText}>Email</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Manual Copy */}
          <Card style={styles.manualCard} padding={20} margin={16}>
            <Text style={styles.manualTitle}>🔗 Manual Sharing</Text>
            <Text style={styles.manualCode}>{referralCode}</Text>
            <Button
              title="Copy Code"
              onPress={async () => {
                await Clipboard.setString(referralCode);
                Alert.alert('Success', 'Referral code copied to clipboard!');
              }}
              variant="outline"
              style={styles.copyManualButton}
            />
          </Card>

          <View style={styles.modalCloseContainer}>
            <Button
              title="Close Sharing"
              onPress={() => setSharingModalVisible(false)}
              variant="outline"
              style={styles.modalCloseButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  </View>
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
    paddingBottom: 20,
  },
  codeCard: {
    backgroundColor: '#41036dff',
    alignItems: 'center',
  },
  codeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  codeValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  codeDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  codeSubDescription: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.8,
  },
  shareButton: {
    backgroundColor: '#ec650bec',
    width: '100%',
  },
  earningsCard: {
    backgroundColor: '#e27024ff',
    alignItems: 'center',
  },
  earningsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  earningsAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  withdrawButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  minimumText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
  },
  levelsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#070707ff',
    marginBottom: 16,
    marginTop: 8,
  },
  levelCard: {
    backgroundColor: '#fff',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#070707ff',
  },
  levelBonus: {
    fontSize: 14,
    color: '#41036dff',
    fontWeight: '500',
  },
  levelStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#070707ff',
  },
  statLabel: {
    fontSize: 12,
    color: '#58585aff',
    marginTop: 4,
  },
  referralsSection: {
    paddingHorizontal: 16,
  },
  referralCard: {
    backgroundColor: '#fff',
  },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#070707ff',
    marginBottom: 2,
  },
  referralEmail: {
    fontSize: 14,
    color: '#58585aff',
    marginBottom: 2,
  },
  referralDate: {
    fontSize: 12,
    color: '#58585aff',
  },
  referralEarnings: {
    alignItems: 'flex-end',
  },
  referralEarningsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
    marginBottom: 2,
  },
  earningsLevel: {
    fontSize: 12,
    color: '#58585aff',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#58585aff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#58585aff',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#070707ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#41036dff',
    marginRight: 12,
    marginTop: 2,
    width: 24,
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#070707ff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#58585aff',
    lineHeight: 20,
  },
  bonusInfo: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#070707ff',
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 14,
    color: '#41036dff',
    marginBottom: 4,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: '#fff8f0',
    padding: 16,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#070707ff',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#58585aff',
    marginBottom: 4,
    lineHeight: 20,
  },
  calculatorCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  calculatorIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  calculatorContent: {
    flex: 1,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#070707ff',
    marginBottom: 4,
  },
  calculatorSubtitle: {
    fontSize: 14,
    color: '#58585aff',
  },
  calculatorArrow: {
    fontSize: 20,
    color: '#58585aff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#4B0082',
    padding: 20,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 22,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  calculatorInputsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  calculatorInputsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  inputField: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  resetButton: {
    marginTop: 10,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#4B0082',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  bonusCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  bonusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  bonusCardText: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  modalCloseContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  modalCloseButton: {
    borderColor: '#4B0082',
  },
  withdrawalAmountCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  withdrawalAmountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
    textAlign: 'center',
  },
  availableBalance: {
    fontSize: 16,
    color: '#4B0082',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  feeBreakdown: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
  },
  feeText: {
    fontSize: 14,
    color: '#1c1c1e',
    marginBottom: 4,
  },
  netAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
    marginTop: 8,
  },
  bankDetailsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  bankDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
    textAlign: 'center',
  },
  accountInput: {
    width: 140,
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bankCodeInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  accountNameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  withdrawalButtonContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  withdrawalSubmitButton: {
    backgroundColor: '#4B0082',
  },
  requirementsInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  requirementsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  requirementsDetail: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4,
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureButton: {
    alignItems: 'center',
    padding: 16,
    minWidth: 80,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  multiLevelCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  multiLevelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
    textAlign: 'center',
  },
  multiLevelSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 16,
  },
  multiLevelGrid: {
    justifyContent: 'space-between',
  },
  multiLevelNote: {
    fontSize: 14,
    color: '#4B0082',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  extendedLevelCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 4,
    flex: 1,
    maxWidth: '48%',
  },
  extendedLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  extendedLevelNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  extendedLevelBonus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34c759',
  },
  extendedLevelDescription: {
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  historyUser: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  historyEarnings: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
    marginBottom: 2,
  },
  historyLevel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  supportCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  supportQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  supportAnswer: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  contactButton: {
    flex: 1,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sharingOptionsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  sharingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 16,
    textAlign: 'center',
  },
  sharingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  sharingButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
    margin: 4,
  },
  sharingIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  sharingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  manualCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  manualCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B0082',
    letterSpacing: 2,
    marginBottom: 16,
  },
  copyManualButton: {
    borderColor: '#4B0082',
  },
});
