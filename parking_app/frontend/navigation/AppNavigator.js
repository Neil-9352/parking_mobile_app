/**
 * App Navigator
 * Stack navigator for all screens in the parking app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DateSelectionScreen from '../screens/DateSelectionScreen';
import ParkingLotsScreen from '../screens/ParkingLotsScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import VehicleScreen from '../screens/VehicleScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* Main Screens */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            headerLeft: () => null, // Prevent going back to login
          }}
        />
        <Stack.Screen
          name="DateSelection"
          component={DateSelectionScreen}
          options={{ title: 'Select Duration' }}
        />
        <Stack.Screen
          name="ParkingLots"
          component={ParkingLotsScreen}
          options={{ title: 'Available Lots' }}
        />
        <Stack.Screen
          name="SlotSelection"
          component={SlotSelectionScreen}
          options={{ title: 'Select a Slot' }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: 'Confirm Booking' }}
        />
        <Stack.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{ title: 'My Bookings' }}
        />
        <Stack.Screen
          name="Receipts"
          component={ReceiptsScreen}
          options={{ title: 'Receipts' }}
        />
        <Stack.Screen
          name="Vehicles"
          component={VehicleScreen}
          options={{ title: 'My Vehicles' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
