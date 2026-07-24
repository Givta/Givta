import React, { useState, useRef, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TextInput, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BiometricService } from '../services/biometric';
import { userCollection } from '../collections/users';

const Stack = createStackNavigator();

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('fingerprint');
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Auto-add "234" prefix for Nigerian phone numbers
  const handleIdentifierChange = (text: string) => {
    // If user enters a Nigerian phone without 234, add it automatically
    if (text.match(/^(\+?)([7-9][0-9]{9})$/) && !text.includes('234')) {
      // User entered Nigerian phone without prefix, add 234
      const cleanedNumber = text.replace(/^\+?/, ''); // Remove any existing +
      setIdentifier(`+234${cleanedNumber}`);
    } else {
      setIdentifier(text);
    }
  };

  // Initialize biometric authentication on login screen load and refresh on focus
  const refreshBiometricStatus = async () => {
    try {
      console.log('🔐 Refreshing biometric authentication status...');
      const { available, types } = await BiometricService.isBiometricAvailable();
      console.log('🔐 Biometric available:', available, 'types:', types);

      setBiometricAvailable(available);

      if (available) {
        const isEnabled = await BiometricService.isBiometricEnabled();
        console.log('🔐 Biometric enabled:', isEnabled);
        setBiometricEnabled(isEnabled);

        if (isEnabled) {
          const type = await BiometricService.getBiometricType();
          setBiometricType(type);
          console.log('🔐 Biometric type:', type);
        }
      }
    } catch (error) {
      console.error('Error refreshing biometric status:', error);
    }
  };

  // Initialize biometric authentication on login screen load
  useEffect(() => {
    refreshBiometricStatus();
  }, []);

  // Refresh biometric status when screen comes into focus (e.g., when returning from Security screen)
  useFocusEffect(
    React.useCallback(() => {
      refreshBiometricStatus();
    }, [])
  );

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(identifier.trim(), password.trim());
      // If signIn succeeds, the auth state listener will navigate away
      // So we don't need to manually clear loading here - component will unmount
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
      setLoading(false); // Clear loading on error
    }

    // Safety timeout: clear loading after 10 seconds in case auth flow gets stuck
    setTimeout(() => {
      setLoading(false);
    }, 10000);
  };

  const handleBiometricLogin = async () => {
    try {
      setBiometricLoading(true);

      // Attempt biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometric',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Use Email & Password',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        // Biometric succeeded - get stored credentials and auto-fill
        const result = await BiometricService.authenticateBiometric();

        if (result.success && result.credentials) {
          setIdentifier(result.credentials.email);
          setPassword(result.credentials.password);

          // Attempt automatic login with retrieved credentials
          await signIn(result.credentials.email, result.credentials.password);
        } else {
          Alert.alert('Error', 'Could not retrieve stored credentials. Please login manually.');
        }
      } else {
        // User cancelled or biometric failed - just show error, don't force fallback
        Alert.alert('Biometric Cancelled', 'Please use email and password to login.');
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert('Biometric Failed', 'Please use email and password to login instead.');
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* App Logo */}
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Welcome Back</Text>

          {/* Login Form */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or phone"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={handleIdentifierChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signupButton}
          />



          {/* Biometric Login Button - Only show when enabled */}
          {biometricEnabled && (
            <View style={styles.biometricContainer}>
              <Button
                title={`Login with ${biometricType === 'face' ? 'Face ID' : 'Fingerprint'}`}
                onPress={handleBiometricLogin}
                loading={biometricLoading}
                variant="outline"
                style={styles.biometricButton}
              />
            </View>
          )}

          {/* Divider - Only show when biometric is enabled */}
          {biometricEnabled && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          <View style={styles.forgotPasswordContainer}>
            <Button
              title="Forgot Password?"
              onPress={() => navigation.navigate('ForgotPassword')}
              variant="outline"
              style={styles.forgotPasswordButton}
            />
          </View>

          <Button
            title="Don't have an account? Sign Up"
            onPress={() => navigation.navigate('Signup')}
            variant="outline"
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const SignupScreen: React.FC<any> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check username availability via API
  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    try {
      setCheckingUsername(true);

      console.log('Checking username availability for:', usernameToCheck);
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/check-username`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Username check request timed out after 10 seconds');
        controller.abort();
      }, 10000); // 10 second timeout

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToCheck }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Username check response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Username check response data:', data);

      if (data.success) {
        setUsernameAvailable(data.data.available);
        console.log('Username availability result:', data.data.available);
      } else {
        console.error('Username check failed:', data.message);
        setUsernameAvailable(null);
      }
    } catch (error: any) {
      console.error('Error checking username availability:', error);
      console.error('Error details:', error.message);
      setUsernameAvailable(null);
      if (error.name === 'AbortError') {
        console.error('Username check request timed out after 10 seconds');
        Alert.alert('Connection Error', 'Unable to check username availability. Please check your internet connection and try again.');
      } else {
        console.error('Network or server error occurred');
      }
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle username change with debouncing
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setUsernameAvailable(null); // Reset availability status

    // Clear any existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Debounce the availability check
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(text);
    }, 500);
  };

  const handleSignup = async () => {
    if (!email.trim() || !phoneNumber.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert('Error', 'Username must be 3-20 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    // Check username availability
    if (usernameAvailable === false) {
      Alert.alert('Error', 'This username is already taken. Please choose a different username.');
      return;
    }

    if (usernameAvailable === null && username.length >= 3) {
      Alert.alert('Error', 'Please wait while we check username availability.');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        username: username.trim(),
        password: password.trim(),
        referralCode: referralCode.trim() || undefined,
      });
      Alert.alert('Success', 'Account created successfully! Welcome to Givta!');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* App Logo */}
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Create Account</Text>

          {/* Individual Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {/* Username availability status */}
            {username.length >= 3 && (
              <View style={styles.usernameStatusContainer}>
                {checkingUsername ? (
                  <>
                    <ActivityIndicator size="small" color="#4B0082" />
                    <Text style={styles.checkingText}>Checking availability...</Text>
                  </>
                ) : usernameAvailable === true ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#34c759" />
                    <Text style={styles.availableText}>Username is available</Text>
                  </>
                ) : usernameAvailable === false ? (
                  <>
                    <Ionicons name="close-circle" size={16} color="#ff3b30" />
                    <Text style={styles.takenText}>Username is already taken</Text>
                  </>
                ) : null}
              </View>
            )}
          </View>

          {/* Password Fields - Grid Layout */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.gridRow}>
              <TextInput
                style={[styles.input, styles.gridInput]}
                placeholder="Create password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, styles.gridInput]}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Referral Code - Full Width */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code if you have one"
              placeholderTextColor="#999"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />

          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const ForgotPasswordScreen: React.FC<any> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-add "234" prefix for Nigerian phone numbers (same logic as login)
  const handleIdentifierChange = (text: string) => {
    // If user enters a Nigerian phone without 234, add it automatically
    if (text.match(/^(\+?)([7-9][0-9]{9})$/) && !text.includes('234')) {
      // User entered Nigerian phone without prefix, add 234
      const cleanedNumber = text.replace(/^\+?/, ''); // Remove any existing +
      setIdentifier(`+234${cleanedNumber}`);
    } else {
      setIdentifier(text);
    }
  };

  const handleResetPassword = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);

      console.log('Sending password reset email to:', identifier.trim());

      // Send password reset email using Firebase Auth
      await sendPasswordResetEmail(auth, identifier.trim());

      Alert.alert(
        'Password Reset Email Sent! 📧',
        `A password reset link has been sent to ${identifier.trim()}. Check your email and follow the instructions to reset your password.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      console.log('Password reset email sent successfully to:', identifier.trim());

    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email. Please try again.';

      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many reset attempts. Please try again later.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* App Logo */}
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address or phone number and we'll send you a link to reset your password.
          </Text>

          {/* Reset Form */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or phone"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={handleIdentifierChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.signupButton}
          />

          <Button
            title="Back to Login"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignSelf: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gridInput: {
    flex: 1,
    marginHorizontal: 3,
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 6,
  },
  signupButton: {
    marginTop: 5,
    marginBottom: 10,
  },
  loginButton: {
    marginTop: 5,
  },
  forgotPasswordContainer: {
    marginTop: 0,
    marginBottom: 10,
    alignItems: 'center',
  },
  forgotPasswordButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formCard: {
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  usernameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkingText: {
    fontSize: 12,
    color: '#4B0082',
    marginLeft: 6,
  },
  availableText: {
    fontSize: 12,
    color: '#34c759',
    marginLeft: 6,
  },
  takenText: {
    fontSize: 12,
    color: '#ff3b30',
    marginLeft: 6,
  },
  biometricContainer: {
    marginTop: 10,
  },
  biometricButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#4B0082',
  },
  debugInfo: {
    backgroundColor: '#ffeaa7',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#d63031',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  testButton: {
    marginTop: 8,
  },
});

export default AuthNavigator;
