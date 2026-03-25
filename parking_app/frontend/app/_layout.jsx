/**
 * Root Layout
 * Defines the Stack navigator and wraps with PaperProvider theme
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';

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

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a73e8',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="date-selection"
          options={{ title: 'Select Duration' }}
        />
        <Stack.Screen
          name="parking-lots"
          options={{ title: 'Available Lots' }}
        />
        <Stack.Screen
          name="slot-selection/[lotId]"
          options={{ title: 'Select a Slot' }}
        />
        <Stack.Screen
          name="booking/[slotId]"
          options={{ title: 'Confirm Booking' }}
        />
        <Stack.Screen
          name="my-bookings"
          options={{ title: 'My Bookings' }}
        />
        <Stack.Screen
          name="receipts"
          options={{ title: 'Receipts' }}
        />
        <Stack.Screen
          name="vehicles"
          options={{ title: 'My Vehicles' }}
        />
      </Stack>
    </PaperProvider>
  );
}
