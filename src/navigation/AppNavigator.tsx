import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, SafeAreaView, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { WalletScreen } from '../screens/WalletScreen';
import { TipScreen } from '../screens/TipScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChatBotScreen } from '../screens/ChatBotScreen';
import { PaymentScreen } from '../screens/PaymentScreen';

import { FeedbackScreen } from '../screens/FeedbackScreen';
import { ExternalTipScreen } from '../screens/ExternalTipScreen';

import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AppPreferencesScreen } from '../screens/AppPreferencesScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

import AuthNavigator from './AuthNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Configure deep linking prefixes for full app functionality
const linking = {
  prefixes: [Linking.createURL('/'), 'givta://', 'https://givta.com.ng', 'https://www.givta.com.ng'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',

      MainTabs: '',

      Payment: 'payment',
      EditProfile: 'edit-profile',
      Security: 'security',
      Analytics: 'analytics',
      Notifications: 'notifications',

      ExternalTip: 'tip/:username',
      PublicTip: 'public-tip/:username',
    },
  },
};

const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4B0082',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e1e5e9',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 5 : 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        headerStyle: {
          backgroundColor: '#4B0082',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tip"
        component={TipScreen}
        options={{
          tabBarLabel: 'Tip',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          tabBarLabel: 'Feedback',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
  <Tab.Screen
    name="Referral"
    component={ReferralScreen}
    options={{
      tabBarLabel: 'Referral',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="people-outline" size={size} color={color} />
      ),
    }}
  />

  <Tab.Screen
    name="Profile"
    component={ProfileScreen}
    options={{
      tabBarLabel: 'Profile',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="person-outline" size={size} color={color} />
      ),
    }}
  />
    </Tab.Navigator>
  );
};

const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4B0082',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={({ route }: any) => ({
          title: route.params?.paymentType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds',
        })}
      />
      {/* Profile-related screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="AppPreferences"
        component={AppPreferencesScreen}
        options={{
          title: 'App Preferences',
        }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{
          title: 'Security',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          title: 'Terms of Service',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: 'Privacy Policy',
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          title: 'Help & Support',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="ExternalTip"
        component={ExternalTipScreen}
        options={{
          title: 'Send Tip',
        }}
      />
      <Stack.Screen
        name="PublicTip"
        component={ExternalTipScreen}
        options={{
          title: 'Send Public Tip',
        }}
      />

    </Stack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Text style={{ fontSize: 18, color: '#8e8e93' }}>Loading Givta...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        {user ? <MainStack /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
