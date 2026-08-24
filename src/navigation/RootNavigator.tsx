import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

const linking = {
  prefixes: ['sade://'],
};

export default function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Splash / Loading enquanto verifica se há sessão salva
  if (isLoading) {
    return (
      <Box flex={1} bg="#2A5D44" justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </Box>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
