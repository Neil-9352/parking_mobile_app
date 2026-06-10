/**
 * Root Layout
 * Defines the Stack navigator and wraps with PaperProvider theme
 */

import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

/**
 * Header back button that always navigates to /dashboard,
 * replacing the stack so the user can't swipe back into the sub-flow.
 */
function BackToDashboard() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.replace('/dashboard')}
      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

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

        {/* ── Top-level feature screens: back → dashboard ── */}
        <Stack.Screen
          name="date-selection"
          options={{ title: 'Select Duration', headerLeft: () => <BackToDashboard /> }}
        />
        <Stack.Screen
          name="my-bookings"
          options={{ title: 'My Bookings', headerLeft: () => <BackToDashboard /> }}
        />
        <Stack.Screen
          name="receipts"
          options={{ title: 'Receipts', headerLeft: () => <BackToDashboard /> }}
        />
        <Stack.Screen
          name="vehicles"
          options={{ title: 'My Vehicles', headerLeft: () => <BackToDashboard /> }}
        />

        {/* ── Find-parking sub-pages: normal back-stack behaviour ── */}
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
      </Stack>
    </PaperProvider>
  );
}
