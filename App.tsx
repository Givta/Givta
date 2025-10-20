import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { apiService } from './src/services/api';

// Import Expo notifications for easier setup
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default function App() {
  useEffect(() => {
    // Initialize Expo notifications
    initializeNotifications();

    // Note: setNotificationHandler is optional and varies by Expo SDK version

    // Handle notifications received while app is in foreground
    const subscriptionReceive = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Foreground notification received:', notification);
      displayNotification(notification);
    });

    // Handle notifications opened by user
    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification opened:', response);
      handleNotificationPress(response);
    });

    // Clean up subscriptions
    return () => {
      subscriptionReceive.remove();
      subscriptionResponse.remove();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions for notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
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

      return true;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  };

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

  const displayNotification = async (notification: Notifications.Notification) => {
    try {
      // Display notification as Alert for foreground notifications
      const title = notification.request.content.title || 'Givta';
      const body = notification.request.content.body || 'You have a new notification';

      Alert.alert(title, body, [
        { text: 'OK', style: 'default' }
      ]);

      console.log('📢 Foreground notification displayed via Alert');
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
    }
  };

  const handleNotificationPress = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      if (data) {
        console.log('📱 Handling notification press:', data);

        // Ensure message is a string (handles string | object type)
        const message = typeof data.message === 'string'
          ? data.message
          : (data.message
             ? JSON.stringify(data.message)
             : 'You have a new notification');

        // Handle different notification types
        switch (data.type) {
          case 'transaction':
            // Navigate to wallet/transactions screen
            Alert.alert('Transaction Update', message);
            break;
          case 'tip':
            // Navigate to tips screen
            Alert.alert('Tip Received!', message);
            break;
          case 'security':
            // Navigate to security/settings
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
