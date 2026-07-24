import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { apiService } from '../services/api';
import { paystackService } from '../services/paystack';

interface PaystackWebViewProps {
  amount: number;
  paymentUrl?: string;
  onSuccess: (response: any) => void;
  onCancel: () => void;
  reference?: string;
}

export const PaystackWebView: React.FC<PaystackWebViewProps> = ({
  amount,
  paymentUrl: initialPaymentUrl,
  onSuccess,
  onCancel,
  reference,
}) => {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string>(initialPaymentUrl || '');

  React.useEffect(() => {
    if (!initialPaymentUrl) {
      Alert.alert('Error', 'Payment URL is required');
      onCancel();
      return;
    }

    setPaymentUrl(initialPaymentUrl);
  }, [initialPaymentUrl]);

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    // Check for Paystack success callback
    if (url.includes('success') || url.includes('successful')) {
      try {
        // Extract reference from URL or use provided reference
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const paymentRef = urlParams.get('reference') || reference;

        if (paymentRef) {
          // Verify payment on backend
          const verifyResponse = await apiService.verifyPaystackPayment(paymentRef);

          if (verifyResponse.success) {
            // Payment was successful - wallet should be credited via webhook
            // The webhook will handle the actual crediting, we just need to refresh the balance
            // Note: We don't call deposit() here to avoid double-crediting
            Alert.alert('Success', 'Payment successful! Your wallet has been credited.');
            onSuccess({ transactionRef: paymentRef });
          } else {
            Alert.alert('Error', 'Payment verification failed. Please contact support if you were charged.');
            onCancel();
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        Alert.alert('Error', 'Payment verification failed. Please contact support if you were charged.');
        onCancel();
      }
    }

    // Check for Paystack cancel callback
    if (url.includes('cancel') || url.includes('cancelled')) {
      onCancel();
    }
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);

    // If WebView fails, fall back to opening in external browser
    if (paymentUrl) {
      Alert.alert(
        'WebView Issue',
        'Opening payment in your browser instead.',
        [
          {
            text: 'Cancel',
            onPress: onCancel,
            style: 'cancel'
          },
          {
            text: 'Open Browser',
            onPress: () => {
              const Linking = require('react-native').Linking;
              Linking.openURL(paymentUrl).then(() => {
                Alert.alert(
                  'Payment Opened',
                  'Complete your payment in the browser and return to the app.',
                  [{ text: 'OK', onPress: () => onCancel() }]
                );
              }).catch(() => {
                Alert.alert('Error', 'Could not open payment link. Please try again later.');
                onCancel();
              });
            }
          }
        ]
      );
      return;
    }

    Alert.alert('Error', 'Payment failed. Please try again.');
    onCancel();
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  if (!paymentUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Initializing payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4B0082" />
          <Text style={styles.loadingText}>Loading payment...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        style={styles.webView}
        injectedJavaScript={`
          // Inject custom styles for better mobile experience
          const style = document.createElement('style');
          style.textContent = \`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .paystack-button {
              background-color: #4B0082 !important;
              border-color: #4B0082 !important;
            }
            .paystack-button:hover {
              background-color: #3a0666 !important;
            }
          \`;
          document.head.appendChild(style);

          // Auto-submit form if available (for better UX)
          setTimeout(() => {
            const payButton = document.querySelector('button[type="submit"], input[type="submit"], .paystack-button');
            if (payButton && !payButton.hasAttribute('data-auto-clicked')) {
              payButton.setAttribute('data-auto-clicked', 'true');
              // Don't auto-click for security - let user interact
            }
          }, 2000);
        `}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B0082',
    fontWeight: '500',
  },
});
