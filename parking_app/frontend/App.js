/**
 * Parking Mobile App - Root Component
 * Wraps the app with PaperProvider and loads the AppNavigator
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { registerRootComponent } from 'expo';
import AppNavigator from './navigation/AppNavigator';

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1a73e8',
    secondary: '#4caf50',
    accent: '#ff9800',
    background: '#f5f5f5',
    surface: '#ffffff',
    error: '#d32f2f',
  },
  roundness: 8,
};

function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <AppNavigator />
    </PaperProvider>
  );
}

registerRootComponent(App);
