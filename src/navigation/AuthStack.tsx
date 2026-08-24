import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import ProfileSelectScreen from '../screens/Auth/ProfileSelectScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import EmailConfirmationScreen from '../screens/Auth/EmailConfirmationScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  ProfileSelect: undefined;
  Register: { role: 'PATIENT' | 'PROFESSIONAL' | 'INSTITUTION' };
  EmailConfirmation: { email: string; type: 'register' | 'forgot_password' };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
