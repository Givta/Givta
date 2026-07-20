import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  rulesContent: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  visible,
  onClose,
  title,
  rulesContent,
}) => {
  // Simple markdown-like parser for the rules content
  const renderRulesContent = (content: string) => {
    const sections = content.split('---').map(section => section.trim());

    return (
      <View>
        {sections.map((section, index) => {
          if (!section) return null;

          const lines = section.split('\n');
          const sectionTitle = lines[0].startsWith('#') ? lines.shift()?.replace('## ', '').replace('# ', '') : null;

          return (
            <View key={index}>
              {sectionTitle && (
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              )}
              {lines.map((line, lineIndex) => {
                if (!line.trim()) return null;

                // Handle headers
                if (line.startsWith('## ')) {
                  return (
                    <Text key={lineIndex} style={styles.subsectionTitle}>
                      {line.replace('## ', '')}
                    </Text>
                  );
                }

                // Handle bullet points
                if (line.startsWith('- **') || line.startsWith('1. **') || line.startsWith('✅ **') || line.startsWith('🚀 **')) {
                  const isOrdered = /^\d+\./.test(line);
                  const cleanLine = line.replace(/^[- \d]+\. \*\*/, '').replace(/\*\*$/, '');
                  return (
                    <View key={lineIndex} style={styles.bulletPoint}>
                      {isOrdered ? (
                        <Text style={[styles.bulletIcon, styles.orderedNumber]}>
                          {line.match(/^\d+\./)?.[0]?.replace('.', '')}
                        </Text>
                      ) : (
                        <Text style={styles.bulletIcon}>•</Text>
                      )}
                      <Text style={styles.bulletText}>{cleanLine}</Text>
                    </View>
                  );
                }

                // Handle emoji bullets
                if (line.startsWith('✅ ') || line.startsWith('🚀 ') || line.startsWith('💰 ') ||
                    line.startsWith('🏆 ') || line.startsWith('🚫 ') || line.startsWith('⚠️ ') ||
                    line.startsWith('🔔 ') || line.startsWith('📋 ') || line.startsWith('💡 ')) {
                  const emojiMatch = line.match(/^[✅🚀💰🏆🚫⚠️🔔📋💡]+\s*/);
                  const emoji = emojiMatch?.[0]?.trim();
                  const text = line.replace(emojiMatch?.[0] || '', '');
                  return (
                    <View key={lineIndex} style={styles.emojiBulletPoint}>
                      <Text style={styles.emojiIcon}>{emoji}</Text>
                      <Text style={styles.emojiBulletText}>{text}</Text>
                    </View>
                  );
                }

                // Handle bold text
                if (line.includes('**')) {
                  const parts = line.split('**');
                  return (
                    <Text key={lineIndex} style={styles.paragraph}>
                      {parts.map((part, partIndex) => (
                        <Text
                          key={partIndex}
                          style={partIndex % 2 === 1 ? styles.boldText : styles.regularText}
                        >
                          {part}
                        </Text>
                      ))}
                    </Text>
                  );
                }

                // Regular paragraphs
                return (
                  <Text key={lineIndex} style={styles.paragraph}>
                    {line}
                  </Text>
                );
              })}
              {sectionTitle && <View style={styles.sectionDivider} />}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#1c1c1e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {renderRulesContent(rulesContent)}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="I Understand"
            onPress={onClose}
            style={styles.understandButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B0082',
    marginTop: 24,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginTop: 16,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 24,
    marginBottom: 12,
  },
  regularText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  boldText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletIcon: {
    fontSize: 16,
    color: '#4B0082',
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  orderedNumber: {
    backgroundColor: '#4B0082',
    color: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    paddingTop: 2,
  },
  bulletText: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 22,
    flex: 1,
  },
  emojiBulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  emojiIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  emojiBulletText: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 22,
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  understandButton: {
    marginBottom: 0,
  },
});
