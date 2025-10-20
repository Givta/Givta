import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface BiometricCredentials {
  email: string;
  password: string;
}

export class BiometricService {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly CREDENTIALS_KEY = 'biometric_credentials';
  private static readonly BIOMETRIC_TYPE_KEY = 'biometric_type';

  /**
   * Check if device supports biometric authentication
   */
  static async isBiometricAvailable(): Promise<{
    available: boolean;
    types: LocalAuthentication.AuthenticationType[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        available: hasHardware && isEnrolled,
        types: supportedTypes
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { available: false, types: [] };
    }
  }

  /**
   * Check if biometric authentication is enabled for this user
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_ENABLED_KEY);
      console.log('🔐 isBiometricEnabled - stored value:', enabled, 'result:', enabled === 'true');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication and store credentials
   */
  static async enableBiometric(credentials: BiometricCredentials): Promise<boolean> {
    try {
      console.log('🔐 enableBiometric called with credentials:', credentials.email);

      // Check if device supports biometric
      const { available } = await this.isBiometricAvailable();
      console.log('🔐 Device biometric available:', available);

      if (!available) {
        console.log('🔐 Device does not support biometric');
        return false;
      }

      // Encrypt and store credentials securely
      const credentialsStr = JSON.stringify(credentials);
      console.log('🔐 Storing credentials for:', credentials.email);

      await SecureStore.setItemAsync(this.CREDENTIALS_KEY, credentialsStr, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      });

      // Store biometric enabled status
      console.log('🔐 Setting biometric enabled to true');
      await AsyncStorage.setItem(this.BIOMETRIC_ENABLED_KEY, 'true');

      // Store biometric type for UI display
      const { types } = await this.isBiometricAvailable();
      const biometricType = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? 'face' : 'fingerprint';
      console.log('🔐 Setting biometric type to:', biometricType);

      await AsyncStorage.setItem(this.BIOMETRIC_TYPE_KEY, biometricType);

      console.log('🔐 Biometric authentication enabled successfully');
      return true;
    } catch (error) {
      console.error('🔐 Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication and remove stored credentials
   */
  static async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.CREDENTIALS_KEY);
      await AsyncStorage.multiRemove([
        this.BIOMETRIC_ENABLED_KEY,
        this.BIOMETRIC_TYPE_KEY
      ]);
      console.log('Biometric authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  /**
   * Attempt biometric authentication and return credentials if successful
   */
  static async authenticateBiometric(): Promise<{
    success: boolean;
    credentials?: BiometricCredentials;
  }> {
    try {
      // Check if biometric is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false };
      }

      // Attempt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Retrieve stored credentials
        const credentialsStr = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
        if (credentialsStr) {
          const credentials = JSON.parse(credentialsStr);
          return { success: true, credentials };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return { success: false };
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  static async getBiometricType(): Promise<string> {
    try {
      const type = await AsyncStorage.getItem(this.BIOMETRIC_TYPE_KEY);
      if (type) {
        return type;
      }

      // Check device capabilities if no stored type
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      }

      return 'fingerprint';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'fingerprint';
    }
  }

  /**
   * Clear all biometric data (useful for logout)
   */
  static async clearBiometricData(): Promise<void> {
    try {
      await this.disableBiometric();
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }
}
