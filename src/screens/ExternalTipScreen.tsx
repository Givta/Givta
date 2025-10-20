import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TipLink {
  id: string;
  userId: string;
  title: string;
  description: string;
  customSlug: string;
  isActive: boolean;
  totalTips: number;
  totalTippers: number;
  views: number;
  settings: {
    allowAnonymous: boolean;
    showRecentTips: boolean;
    customMessage: string;
  };
  createdAt: any;
  updatedAt: any;
}

type RootStackParamList = {
  ExternalTip: { tipLinkId: string };
};

type ExternalTipRouteProp = RouteProp<RootStackParamList, 'ExternalTip'>;
type ExternalTipNavigationProp = StackNavigationProp<RootStackParamList>;

export const ExternalTipScreen: React.FC = () => {
  const route = useRoute<ExternalTipRouteProp>();
  const navigation = useNavigation<ExternalTipNavigationProp>();
  const { user } = useAuth();

  const [tipLink, setTipLink] = useState<TipLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize tipLinkId to prevent unnecessary re-renders
  const tipLinkId = useMemo(() => route.params?.tipLinkId, [route.params]);

  useEffect(() => {
    if (tipLinkId) {
      loadTipLink();
    } else {
      setError('Invalid tip link ID');
      setLoading(false);
    }
  }, [tipLinkId]);

  const loadTipLink = async () => {
    try {
      const { tipLinkId } = route.params;

      if (!tipLinkId) {
        setError('Invalid tip link ID');
        return;
      }

      const tipLinkDoc = await getDoc(doc(db, 'tipLinks', tipLinkId));

      if (!tipLinkDoc.exists()) {
        setError('Tip link not found');
        return;
      }

      const tipLinkData = tipLinkDoc.data() as TipLink;

      if (!tipLinkData.isActive) {
        setError('This tip link is no longer active');
        return;
      }

      setTipLink(tipLinkData);
    } catch (err) {
      console.error('Error loading tip link:', err);
      setError('Failed to load tip link');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTip = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to send tips. Please log in and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => {
              // Navigate to login screen
              navigation.navigate('Auth' as any);
            }
          }
        ]
      );
      return;
    }

    // Navigate to the tip screen with the recipient info
    navigation.navigate('Tip' as any, {
      externalTipLink: tipLink
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading tip link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tipLink) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff3b30" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error || 'Something went wrong'}</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tipLink.title}</Text>
          <Text style={styles.subtitle}>
            Total Tips: {tipLink.totalTips} | Tippers: {tipLink.totalTippers}
          </Text>
        </View>

        {/* Description Card */}
        <Card style={styles.descriptionCard} padding={20}>
          <Text style={styles.description}>{tipLink.description}</Text>
          {tipLink.settings.customMessage && (
            <Text style={styles.customMessage}>
              "{tipLink.settings.customMessage}"
            </Text>
          )}
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={24} color="#4B0082" />
            <Text style={styles.statValue}>{tipLink.totalTips}</Text>
            <Text style={styles.statLabel}>Tips</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color="#4B0082" />
            <Text style={styles.statValue}>{tipLink.totalTippers}</Text>
            <Text style={styles.statLabel}>Tippers</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={24} color="#4B0082" />
            <Text style={styles.statValue}>{tipLink.views}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* Send Tip Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Send a Tip 💝"
            onPress={handleSendTip}
            style={styles.tipButton}
            textStyle={styles.tipButtonText}
          />
        </View>

        {/* Info */}
        <Card style={styles.infoCard} padding={16}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color="#8e8e93" />
            <Text style={styles.infoText}>
              {tipLink.settings.allowAnonymous
                ? 'Anonymous tips are allowed on this link'
                : 'You must be logged in to send tips'
              }
            </Text>
          </View>
          {tipLink.settings.showRecentTips && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>Recent tips are shown publicly</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  descriptionCard: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 24,
    marginBottom: 12,
  },
  customMessage: {
    fontSize: 16,
    color: '#4B0082',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B0082',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  tipButton: {
    backgroundColor: '#4B0082',
  },
  tipButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 8,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#8e8e93',
  },
});

export default ExternalTipScreen;
