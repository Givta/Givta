import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import { messaging } from './src/firebase';
import { AuthProvider } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { apiService } from './src/services/api';

export default function App() {
  useEffect(() => {
    // Initialize notifications if messaging is available
    if (messaging) {
      const initializeApp = async () => {
        try {
          // Request permission for notifications
          await requestNotificationPermission();
        } catch (error) {
          console.error('❌ Error initializing notifications:', error);
        }
      };

      initializeApp();

      // Handle notifications when app is in foreground
      const unsubscribeOnMessage = messaging.onMessage(async (remoteMessage: any) => {
        console.log('📱 Foreground notification:', remoteMessage);
        await displayNotification(remoteMessage);
      });

      // Handle notification opened from background/quit state
      const unsubscribeOnNotificationOpened = messaging.onNotificationOpenedApp((remoteMessage: any) => {
        console.log('📱 Notification opened from background:', remoteMessage);
        handleNotificationPress(remoteMessage);
      });

      // Handle notification opened from quit state
      messaging
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage) {
            console.log('📱 Notification opened from quit state:', remoteMessage);
            handleNotificationPress(remoteMessage);
          }
        });

      return () => {
        unsubscribeOnMessage?.();
        unsubscribeOnNotificationOpened?.();
      };
    } else {
      console.log('📱 Messaging not available in this environment');
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      if (!messaging) {
        console.log('📱 Messaging not available, skipping notification permission');
        return;
      }

      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Notification permission granted');
        const token = await messaging.getToken();
        console.log('📱 FCM Token:', token);

        // Send token to backend for push notifications
        await registerDeviceToken(token);
      } else {
        console.log('❌ Notification permission denied');
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
    }
  };

  const registerDeviceToken = async (token: string) => {
    try {
      // This will be called when user is authenticated
      console.log('📱 Device token registered:', token);
      // Token will be sent to backend when user logs in
    } catch (error) {
      console.error('❌ Error registering device token:', error);
    }
  };

  const displayNotification = async (remoteMessage: any) => {
    try {
      // For now, show an alert for foreground notifications
      // TODO: Replace with proper notification display using notifee
      const title = remoteMessage.notification?.title || 'Givta';
      const body = remoteMessage.notification?.body || 'You have a new notification';

      Alert.alert(title, body, [
        { text: 'OK', style: 'default' }
      ]);

      console.log('📢 Foreground notification displayed via Alert');
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
    }
  };

  const handleNotificationPress = (notification: any) => {
    try {
      const data = notification?.data || notification?.notification?.data;
      if (data) {
        console.log('📱 Handling notification press:', data);

        // Handle different notification types
        switch (data.type) {
          case 'transaction':
            // Navigate to wallet/transactions screen
            Alert.alert('Transaction Update', data.message || 'Your transaction status has been updated');
            break;
          case 'tip':
            // Navigate to tips screen
            Alert.alert('Tip Received!', data.message || 'You received a tip!');
            break;
          case 'security':
            // Navigate to security/settings
            Alert.alert('Security Alert', data.message || 'Security event detected');
            break;
          default:
            Alert.alert('Notification', data.message || 'You have a new notification');
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
