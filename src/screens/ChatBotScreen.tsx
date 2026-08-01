import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'quick_reply' | 'action';
  actions?: QuickAction[];
}

interface QuickAction {
  id: string;
  title: string;
  action: string;
}

export const ChatBotScreen: React.FC = () => {
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [dailyCheckInDone, setDailyCheckInDone] = useState(false);
  const [lastCheckInDate, setLastCheckInDate] = useState<string>('');
  const [userStats, setUserStats] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      text: `Hello! I'm Givta Assistant. How can I help you today?\n\nI can assist you with:\n• Wallet and transaction questions\n• Tipping guidance\n• Referral program information\n• Account support\n• WhatsApp integration`,
      isUser: false,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([welcomeMessage]);

    // Keyboard listeners for better UX
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const quickActions: QuickAction[] = [
    { id: 'balance', title: 'Check Balance', action: 'check_balance' },
    { id: 'transactions', title: 'Recent Transactions', action: 'recent_transactions' },
    { id: 'referral', title: 'Referral Code', action: 'referral_code' },
    { id: 'support', title: 'Contact Support', action: 'contact_support' },
    { id: 'whatsapp', title: 'WhatsApp Chat', action: 'whatsapp_chat' },
  ];

  const quickTexts: string[] = [
    "What's my balance?",
    "How do I send a tip?",
    "What's my referral code?",
    "Show recent transactions",
    "Help with referrals",
    "Contact support",
    "How do I withdraw?",
    "Transaction fees",
  ];

  // Award points for user interactions
  const awardPoints = async (points: number, reason: string) => {
    try {
      // In a real app, this would call a backend API
      setUserPoints(prev => prev + points);
      console.log(`Awarded ${points} points for: ${reason}`);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      handleBotResponse(text.trim().toLowerCase());
    }, 1000);
  };

  const handleBotResponse = async (userInput: string) => {
    let botResponse: Message;

    try {
      // Award points for chatbot interaction
      await awardPoints(5, 'Chatbot interaction');

      if (userInput.includes('balance') || userInput.includes('wallet')) {
        console.log(`🔍 ChatBot - Getting user balance for user:`, user ? user.id : 'null');

        // Get real balance from backend
        await refreshBalance();
        const currentBalance = balance;

        console.log(`✅ ChatBot - Current balance: ₦${currentBalance}`);

        botResponse = {
          id: Date.now().toString(),
          text: `💰 Your current wallet balance is: **${formatCurrency(currentBalance)}**\n\nYou can:\n• Deposit funds using the Wallet tab\n• View transaction history\n• Send tips to friends\n• Withdraw earnings (min ₦1,500)`,
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: [
            { id: 'deposit_funds', title: 'Deposit Funds', action: 'deposit_funds' },
            { id: 'transaction_history', title: 'Transaction History', action: 'transaction_history' },
            { id: 'withdraw_earnings', title: 'Withdraw Earnings', action: 'withdraw_earnings' },
          ],
        };
      } else if (userInput.includes('tip') || userInput.includes('send')) {
        botResponse = {
          id: Date.now().toString(),
          text: '🎁 Ready to send a tip? Our tipping system includes:\n\n• 5% platform fee for service maintenance\n• Instant delivery to recipients\n• Secure processing via Paystack\n• Real-time balance updates\n\nWould you like to send a tip now?',
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: [
            { id: 'send_tip_now', title: 'Send Tip Now', action: 'send_tip_now' },
            { id: 'tip_fees', title: 'About Fees', action: 'tip_fees' },
            { id: 'tip_history', title: 'My Tip History', action: 'tip_history' },
          ],
        };
      } else if (userInput.includes('referral') || userInput.includes('code')) {
        console.log(`🔍 ChatBot - Getting referral data for user:`, user ? user.id : 'null');
        console.log(`🔍 ChatBot - User referral code from context:`, user?.referralCode);

        // Use referral code from user context (matches ReferralScreen logic)
        const referralCode = user?.referralCode || 'ABC123';
        console.log(`✅ ChatBot - Final referral code: ${referralCode}`);

        // Try to get referral stats from API
        let totalEarnings = 0;
        let totalReferrals = 0;
        let levelStats: any[] = [];

        const referralResponse = await apiService.getReferralStats();
        if (referralResponse.success && referralResponse.data) {
          const stats = referralResponse.data;
          totalEarnings = stats.totalEarnings || 0;
          totalReferrals = stats.totalReferrals || 0;

          // Calculate total referrals from level stats if not provided
          if (totalReferrals === 0 && stats.levelStats) {
            totalReferrals = stats.levelStats.reduce((sum: number, level: any) => sum + (level.count || 0), 0);
          }

          levelStats = stats.levelStats || [];
          console.log(`✅ ChatBot - Referral stats loaded: earnings=${totalEarnings}, referrals=${totalReferrals}`);
        } else {
          console.log(`❌ ChatBot - Failed to get referral stats:`, referralResponse);
        }

        botResponse = {
          id: Date.now().toString(),
          text: `👥 Your Referral Program Stats:\n\n📊 **Total Earnings:** ${formatCurrency(totalEarnings)}\n👤 **Total Referrals:** ${totalReferrals}\n🔗 **Your Code:** ${referralCode}\n\n🎯 **Bonus Structure:**\n• Level 1: ₦100 (Friend joins)\n• Level 2: ₦50 (Friend becomes active)\n• Level 3: ₦25 (Long-term engagement)\n\nShare your code to start earning!`,
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: [
            { id: 'share_referral', title: 'Share Code', action: 'share_referral' },
            { id: 'referral_history', title: 'Referral History', action: 'referral_history' },
            { id: 'referral_analytics', title: 'View Analytics', action: 'referral_analytics' },
          ],
        };
      } else if (userInput.includes('transaction') || userInput.includes('history')) {
        // Get real transaction data from backend
        const transactionsResponse = await apiService.getTransactions(5);
        let recentTransactions: any[] = [];

        if (transactionsResponse.success && transactionsResponse.data) {
          recentTransactions = transactionsResponse.data.transactions.slice(0, 3);
        }

        let transactionText = '📊 Your Recent Transactions:\n\n';
        if (recentTransactions.length > 0) {
          recentTransactions.forEach((tx: any, index: number) => {
            const icon = tx.type === 'deposit' ? '💰' : tx.type === 'withdrawal' ? '📤' : tx.type === 'tip' ? '🎁' : '👥';
            const sign = tx.type === 'withdrawal' || tx.type === 'tip' ? '-' : '+';
            transactionText += `${icon} ${tx.description}\n${sign}${formatCurrency(tx.amount)} • ${new Date(tx.createdAt).toLocaleDateString()}\n\n`;
          });
        } else {
          transactionText += 'No recent transactions found.\n\n';
        }
        transactionText += 'View all transactions in the Wallet tab.';

        botResponse = {
          id: Date.now().toString(),
          text: transactionText,
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: [
            { id: 'view_all_transactions', title: 'View All', action: 'view_all_transactions' },
            { id: 'export_statement', title: 'Export Statement', action: 'export_statement' },
          ],
        };
      } else if (userInput.includes('withdraw') || userInput.includes('cashout')) {
        const minWithdrawal = 1500;
        const canWithdraw = balance >= minWithdrawal;

        botResponse = {
          id: Date.now().toString(),
          text: `💸 **Withdrawal Information:**\n\n📊 **Current Balance:** ${formatCurrency(balance)}\n💰 **Minimum Withdrawal:** ${formatCurrency(minWithdrawal)}\n📋 **Processing Fee:** 2.3% of withdrawal amount\n⏱️ **Processing Time:** 1-3 business days\n\n${canWithdraw ? '✅ You can withdraw funds now!' : '❌ Your balance is below the minimum withdrawal amount.'}`,
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: canWithdraw ? [
            { id: 'withdraw_now', title: 'Withdraw Now', action: 'withdraw_now' },
            { id: 'withdrawal_fees', title: 'About Fees', action: 'withdrawal_fees' },
          ] : [
            { id: 'earn_more', title: 'Earn More', action: 'earn_more' },
            { id: 'referral_program', title: 'Referral Program', action: 'referral_program' },
          ],
        };
      } else if (userInput.includes('earn') || userInput.includes('points') || userInput.includes('reward')) {
        const dailyReward = dailyCheckInDone ? 0 : 50;
        const totalEarnedToday = userPoints;

        botResponse = {
          id: Date.now().toString(),
          text: `🎁 **Earning Opportunities:**\n\n💰 **Today's Earnings:** ${formatCurrency(totalEarnedToday)}\n📅 **Daily Check-in:** ${dailyReward > 0 ? formatCurrency(dailyReward) + ' available' : 'Already claimed'}\n👥 **Referral Bonus:** Up to ₦100 per referral\n🎯 **Chatbot Rewards:** 5 points per interaction\n\n💡 **Ways to Earn:**\n• Daily check-ins\n• Referring friends\n• Using chatbot features\n• Completing surveys\n• App engagement`,
          isUser: false,
          timestamp: new Date(),
          type: 'quick_reply',
          actions: [
            { id: 'daily_checkin', title: 'Daily Check-in', action: 'daily_checkin' },
            { id: 'referral_program', title: 'Earn from Referrals', action: 'referral_program' },
            { id: 'chatbot_quiz', title: 'Take Quiz', action: 'chatbot_quiz' },
          ],
        };
      } else if (userInput.includes('help') || userInput.includes('support') || userInput.includes('contact')) {
        botResponse = {
          id: Date.now().toString(),
          text: '🆘 **How can I help you today?**\n\nI can assist with:\n\n💰 **Wallet & Balance**\n• Check your balance\n• View transactions\n• Deposit/withdraw funds\n\n🎁 **Tipping**\n• Send tips to friends\n• Tip history\n• Fee information\n\n👥 **Referrals**\n• Your referral code\n• Earnings tracking\n• Referral analytics\n\n📞 **Support**\n• WhatsApp chat\n• Email support\n• FAQ access',
          isUser: false,
          timestamp: new Date(),
          type: 'action',
          actions: [
            ...quickActions,
            { id: 'daily_checkin', title: 'Daily Check-in', action: 'daily_checkin' },
            { id: 'earn_points', title: 'Earn Points', action: 'earn_points' },
          ],
        };
      } else {
        // Unknown query - offer help
        botResponse = {
          id: Date.now().toString(),
          text: '🤔 I\'m not sure I understand that request. Let me help you with what I can do:\n\n💰 Check your wallet balance\n🎁 Send tips to friends\n👥 View referral earnings\n📊 See transaction history\n💸 Withdraw your earnings\n🎯 Earn reward points\n\nWhat would you like to do?',
          isUser: false,
          timestamp: new Date(),
          type: 'action',
          actions: [
            { id: 'check_balance', title: 'Check Balance', action: 'check_balance' },
            { id: 'send_tip', title: 'Send Tip', action: 'send_tip' },
            { id: 'referral_stats', title: 'Referral Stats', action: 'referral_stats' },
            { id: 'daily_checkin', title: 'Daily Check-in', action: 'daily_checkin' },
          ],
        };
      }
    } catch (error) {
      console.error('Bot response error:', error);
      botResponse = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error while processing your request. Please try again or contact support.',
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      };
    }

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'check_balance':
        handleSendMessage('What is my balance?');
        break;
      case 'recent_transactions':
        handleSendMessage('Show my recent transactions');
        break;
      case 'referral_code':
        handleSendMessage('What is my referral code?');
        break;
      case 'contact_support':
        handleSendMessage('I need support');
        break;
      case 'whatsapp_chat':
        handleSendMessage('I want to chat on WhatsApp');
        break;
      case 'show_balance':
        // TODO: Integrate with wallet context
        const balanceMessage: Message = {
          id: Date.now().toString(),
          text: 'Your current balance is: ₦2,500.00\n\nYou can view your full transaction history in the Wallet tab.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, balanceMessage]);
        break;
      case 'transaction_history':
        const historyMessage: Message = {
          id: Date.now().toString(),
          text: 'You can view your transaction history in the Wallet screen. It shows all your deposits, withdrawals, tips, and referral bonuses.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, historyMessage]);
        break;
      case 'get_code':
        const codeMessage: Message = {
          id: Date.now().toString(),
          text: `Your referral code is: ${user?.id.substring(0, 8).toUpperCase() || 'ABC123'}\n\nShare this code with friends to earn bonuses when they join!`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, codeMessage]);
        break;
      case 'open_whatsapp':
        openWhatsApp();
        break;
      case 'how_to_tip':
        const tipGuideMessage: Message = {
          id: Date.now().toString(),
          text: 'How to send a tip:\n\n1. Go to the Tip tab\n2. Enter recipient ID or username\n3. Enter the tip amount\n4. Add a description (optional)\n5. Review the fee breakdown\n6. Tap "Send Tip"\n\nNote: Tips include a 5% platform fee.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tipGuideMessage]);
        break;
      case 'tip_fees':
        const feeMessage: Message = {
          id: Date.now().toString(),
          text: 'About tipping fees:\n\n• Platform fee: 5% of tip amount\n• Example: ₦100 tip = ₦5 fee, recipient receives ₦95\n• The total deducted from your wallet is ₦100\n• All fees are transparently displayed before sending',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, feeMessage]);
        break;
      case 'deposit_funds':
        // TODO: Navigate to deposit screen
        const depositMessage: Message = {
          id: Date.now().toString(),
          text: 'You can deposit funds in the Wallet tab. Choose your deposit amount and use our secure payment flow.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, depositMessage]);
        break;
      case 'withdraw_earnings':
        const withdrawMessage: Message = {
          id: Date.now().toString(),
          text: 'Minimum withdrawal amount is ₦1,500. Processing takes 1-3 business days. Go to Wallet tab to withdraw.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, withdrawMessage]);
        break;
      default:
        handleSendMessage('Help me with ' + action.replace('_', ' '));
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = '+2347043231295'; // Givta Support WhatsApp
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=Hello%20Givta%20Support`;

    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to continue.');
      }
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.botText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          item.isUser ? styles.userTime : styles.botTime
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>

      {item.actions && (
        <View style={styles.actionsContainer}>
          {item.actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              onPress={() => handleQuickAction(action.action)}
            >
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Givta Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-powered support</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { marginBottom: keyboardHeight > 0 ? 20 : 0 }]}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            if (keyboardHeight === 0) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.map((message) => (
            <View key={message.id}>
              {renderMessage({ item: message })}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <View style={[styles.messageBubble, styles.botBubble]}>
                <Text style={styles.typingText}>Typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Text Suggestions */}
        <View style={styles.quickSuggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSuggestionsContent}
          >
            {quickTexts.map((text, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickSuggestionChip}
                onPress={() => handleSendMessage(text)}
              >
                <Text style={styles.quickSuggestionText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight - 160 : 0 }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { maxHeight: keyboardHeight > 0 ? 80 : 100 }]}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (inputText.trim()) {
                handleSendMessage();
              }
            }}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={!inputText.trim() ? '#8e8e93' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#4B0082',
  },
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#1c1c1e',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: '#fff',
    opacity: 0.7,
  },
  botTime: {
    color: '#8e8e93',
  },
  typingText: {
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#4B0082',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionText: {
    color: '#4B0082',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4B0082',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#8e8e93',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickSuggestionsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quickSuggestionsContent: {
    paddingRight: 16,
  },
  quickSuggestionChip: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#4B0082',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  quickSuggestionText: {
    color: '#4B0082',
    fontSize: 14,
    fontWeight: '500',
  },
});
