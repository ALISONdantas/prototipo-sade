import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <RootNavigator />
    </GluestackUIProvider>
  );
}

