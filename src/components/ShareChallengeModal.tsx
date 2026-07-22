import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Clipboard,
  Dimensions,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ShareMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
}

interface ShareChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  challengeDescription?: string;
  shareableUrl: string;
  onShareSuccess?: () => void;
}

const SHARE_METHODS: ShareMethod[] = [
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', gradient: ['#25D366', '#128C7E'] },
  { id: 'twitter', name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2', gradient: ['#1DA1F2', '#0D95E8'] },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', gradient: ['#E4405F', '#C13584'] },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', gradient: ['#1877F2', '#166FE5'] },
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane-outline', color: '#0088cc', gradient: ['#0088cc', '#0077b5'] },
  { id: 'copy', name: 'Copy Link', icon: 'copy-outline', color: '#FF6B35', gradient: ['#FF6B35', '#F7931E'] },
  { id: 'qr', name: 'QR Code', icon: 'qr-code-outline', color: '#6A0DAD', gradient: ['#6A0DAD', '#4B0082'] },
  { id: 'more', name: 'More', icon: 'share-outline', color: '#666666', gradient: ['#666666', '#555555'] }
];

const QUICK_MESSAGES = [
  '🚀 Check this out! Join the challenge!',
  '💪 You won\'t want to miss this challenge!',
  '🎯 Level up with this amazing opportunity!',
  '⭐ Your next big win starts here!',
  '🔥 Time to turn goals into reality!'
];

const POPULAR_HASHTAGS = ['#GivtaChallenge', '#TipToWin', '#ChallengeAccepted', '#MotivationMonday', '#GoalGetter'];
const EMOJIS = ['🎯', '🚀', '💪', '🔥', '⭐', '🎉', '🏆', '✨', '💫', '🌟', '⚡', '🎊'];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ShareChallengeModal: React.FC<ShareChallengeModalProps> = ({
  visible,
  onClose,
  challengeId,
  challengeTitle,
  challengeDescription,
  shareableUrl: propsShareableUrl,
  onShareSuccess
}) => {
  // Generate shareable URL if not provided
  const shareableUrl = propsShareableUrl || `https://givta.com.ng/challenge/${challengeId}`;
  const [customMessage, setCustomMessage] = useState<string>('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'preview'>('quick');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const generateShareMessage = () => {
    const hashtags = selectedHashtags.length > 0 ? `\n\n${selectedHashtags.join(' ')}` : '';
    const message = customMessage.trim() || QUICK_MESSAGES[0];

    const baseMessage = `"${challengeTitle}"\n\n${challengeDescription || 'Join the fun and tip your way to success!'}\n\n💡 ${message}`;

    return baseMessage + hashtags + `\n\n${shareableUrl}\n\n🚀 Shared via Givta`;
  };

  const handleShare = async (method: ShareMethod) => {
    const message = generateShareMessage();

    if (method.id === 'copy') {
      await Clipboard.setString(message);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      Alert.alert('🎉 Link Copied!', 'Challenge link ready to share!', [
        { text: 'Got it!', style: 'default', onPress: onShareSuccess }
      ]);
      return;
    }

    if (method.id === 'qr') {
      Alert.alert('📱 QR Code', 'QR code sharing coming soon!', [
        { text: 'OK', style: 'default' }
      ]);
      return;
    }

    try {
      if (method.id === 'whatsapp') {
        // Direct WhatsApp sharing
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        await Share.share({ url: whatsappUrl });
      } else {
        const shareOptions = {
          message: message,
          url: shareableUrl,
          title: `Join: ${challengeTitle}`,
        };
        await Share.share(shareOptions);
      }
      onShareSuccess?.();

    } catch (error) {
      console.error('Share error:', error);
      try {
        // Fallback to basic sharing
        await Share.share({
          message: message,
        });
        onShareSuccess?.();
      } catch {
        Alert.alert('💔 Share Failed', 'Unable to open sharing options. Try copying the link instead.');
      }
    }
  };

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev =>
      prev.includes(hashtag)
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const addQuickMessage = (message: string) => {
    setCustomMessage(message);
    setActiveTab('preview');
  };

  const clearAll = () => {
    setCustomMessage('');
    setSelectedHashtags([]);
    setActiveTab('quick');
  };

  const handleClose = () => {
    clearAll();
    onClose();
  };

  const renderShareMethod = (method: ShareMethod) => (
    <TouchableOpacity
      key={method.id}
      style={styles.shareMethodCard}
      onPress={() => handleShare(method)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={method.gradient as unknown as readonly [string, string]}
        style={styles.shareMethodIcon}
      >
        <Ionicons name={method.icon as any} size={24} color="#fff" />
      </LinearGradient>
      <Text style={styles.shareMethodName}>{method.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header - Fixed */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="share-social" size={28} color="#4B0082" />
            <Text style={styles.headerTitle}>Share Challenge 🚀</Text>
            <Text style={styles.headerSubtitle}>
              Let your friends join the tipping fun!
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Challenge Preview */}
          <View style={styles.previewSection}>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>{challengeTitle}</Text>
                <Ionicons name="eye-outline" size={16} color="#8e8e93" />
              </View>

              {challengeDescription && (
                <Text style={styles.previewDescription} numberOfLines={2}>
                  {challengeDescription}
                </Text>
              )}

              <View style={styles.previewStats}>
                <TouchableOpacity
                  style={styles.previewUrlContainer}
                  onPress={() => Clipboard.setString(shareableUrl)}
                >
                  <Ionicons name="link-outline" size={14} color="#4B0082" />
                  <Text style={styles.previewUrl} numberOfLines={1} ellipsizeMode="middle">
                    {shareableUrl}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewCopyButton}
                  onPress={() => Clipboard.setString(shareableUrl)}
                >
                  <Ionicons name="copy-outline" size={14} color="#4B0082" />
                  <Text style={styles.previewCopyText}>Full Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Custom Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add a personal message ✍️</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Something encouraging or fun..."
              multiline
              numberOfLines={3}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholderTextColor="#8e8e93"
              maxLength={150}
            />
            <Text style={styles.characterCount}>{customMessage.length}/150</Text>
          </View>

          {/* Quick Emojis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add emojis 🎭</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji: string) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => setCustomMessage(prev => prev + emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hashtags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add hashtags #️⃣</Text>
            <View style={styles.hashtagGrid}>
              {POPULAR_HASHTAGS.map((hashtag: string) => (
                <TouchableOpacity
                  key={hashtag}
                  style={[
                    styles.hashtagButton,
                    selectedHashtags.includes(hashtag) && styles.selectedHashtag
                  ]}
                  onPress={() => toggleHashtag(hashtag)}
                >
                  <Text style={[
                    styles.hashtagText,
                    selectedHashtags.includes(hashtag) && styles.selectedHashtagText
                  ]}>
                    {hashtag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message Preview */}
          {(customMessage.trim() || selectedHashtags.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview 📱</Text>
              <View style={styles.previewMessageCard}>
                <Text style={styles.previewMessageText}>
                  {generateShareMessage()}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAll}
                >
                  <Ionicons name="close-circle" size={20} color="#8e8e93" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Share Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share via 📤</Text>
            <View style={styles.shareMethodsGrid}>
              {SHARE_METHODS.map(renderShareMethod)}
            </View>
          </View>

          {/* Share Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="eye-outline" size={16} color="#8e8e93" />
                  <Text style={styles.statText}>Help others discover this challenge</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="heart-outline" size={16} color="#8e8e93" />
                  <Text style={styles.statText}>Encourage more participants</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="trophy-outline" size={16} color="#8e8e93" />
                  <Text style={styles.statText}>Grow the tipping community</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleClose}
          >
            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleShare(SHARE_METHODS.find(m => m.id === 'copy')!)}
          >
            <LinearGradient
              colors={['#4B0082', '#6A0DAD']}
              style={styles.gradientButton}
            >
              <Ionicons name="link" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Copy Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollableContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginTop: -8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    flex: 1,
    marginRight: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f0e7ff',
    borderRadius: 12,
  },
  previewUrl: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  previewCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0e7ff',
    borderRadius: 16,
    marginLeft: 8,
  },
  previewCopyText: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '600',
    marginLeft: 4,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1c1c1e',
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 4,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  emojiText: {
    fontSize: 20,
  },
  hashtagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectedHashtag: {
    backgroundColor: '#f0e7ff',
    borderColor: '#4B0082',
  },
  hashtagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedHashtagText: {
    color: '#4B0082',
  },
  previewMessageCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewMessageText: {
    fontSize: 14,
    color: '#1c1c1e',
    lineHeight: 20,
    flex: 1,
  },
  clearButton: {
    marginLeft: 12,
    padding: 4,
  },
  shareMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareMethodCard: {
    width: (screenWidth - 40 - 24) / 3,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  shareMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareMethodName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#fff',
    marginTop: 'auto',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
