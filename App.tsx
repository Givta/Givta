import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { apiService } from './src/services/api';

// Dynamically import expo-notifications to avoid native module crash in Expo Go (SDK 53+)
import Constants from 'expo-constants';

// Check if we're running in Expo Go (which dropped push notification support in SDK 53+)
const isExpoGo = Constants.executionEnvironment === 'storeClient';
// Development builds and production apps use 'standalone' or 'bare'
const canUsePushNotifications = !isExpoGo;

export default function App() {
  useEffect(() => {
    if (!canUsePushNotifications) {
      console.log('📱 Push notifications not available in Expo Go. Use a development build for push support.');
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // Dynamic import - never loads in Expo Go, preventing the native crash
        const Notifications = await import('expo-notifications');

        if (!mounted) return;

        // Initialize Expo notifications
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('❌ Notification permission denied');
          return;
        }

        console.log('✅ Notification permission granted');

        // Get device token for push notifications
        if (Constants.isDevice) {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          console.log('📱 Device Token:', tokenData);

          if (tokenData) {
            await registerExpoToken(tokenData.data);
          }
        } else {
          console.log('🖥️ Must use physical device for push notifications');
        }

        // Handle foreground notifications
        const subReceive = Notifications.addNotificationReceivedListener((notification) => {
          const title = notification.request.content.title || 'Givta';
          const body = notification.request.content.body || 'You have a new notification';
          Alert.alert(title, body, [{ text: 'OK', style: 'default' }]);
        });

        // Handle notification opens
        const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
          handleNotificationPress(response);
        });

        // Clean up on unmount
        return () => {
          subReceive.remove();
          subResponse.remove();
        };
      } catch (error) {
        console.warn('📱 Notification setup failed (expected in Expo Go):', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const registerExpoToken = async (token: string) => {
    try {
      const resp = await apiService.registerDeviceToken(token, Platform.OS);
      if (!resp.success) {
        console.warn('📡 Failed to register device token with backend:', resp.error || resp.message);
        await AsyncStorage.setItem('deviceRegistered', 'false');
      } else {
        console.log('📡 Device token registered with backend');
        await AsyncStorage.setItem('deviceRegistered', 'true');
        await AsyncStorage.setItem('deviceToken', token);
      }
    } catch (error) {
      console.error('📡 Error registering device token:', error);
      try {
        await AsyncStorage.setItem('deviceRegistered', 'false');
      } catch {}
    }
  };

  const handleNotificationPress = (response: any) => {
    try {
      const data = response.notification.request.content.data;
      if (data) {
        const message = typeof data.message === 'string'
          ? data.message
          : (data.message
             ? JSON.stringify(data.message)
             : 'You have a new notification');

        switch (data.type) {
          case 'transaction':
            Alert.alert('Transaction Update', message);
            break;
          case 'tip':
            Alert.alert('Tip Received!', message);
            break;
          case 'security':
            Alert.alert('Security Alert', message);
            break;
          default:
            Alert.alert('Notification', message);
        }
      }
    } catch (error) {
      console.error('❌ Error handling notification press:', error);
    }
  };

  return (
    <AuthProvider>
      <WalletProvider>
        <View style={styles.container}>
          <AppNavigator />
          <StatusBar style="auto" />
        </View>
      </WalletProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});