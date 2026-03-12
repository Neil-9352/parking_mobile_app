/**
 * My Bookings Screen
 * Displays all user bookings with status, cancel option
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { bookingAPI } from '../services/api';
import BookingCard from '../components/BookingCard';
import { useFocusEffect } from '@react-navigation/native';

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh bookings every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? You will receive a full refund of ₹500.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bookingAPI.cancelBooking(bookingId);
              if (response.data.success) {
                Alert.alert('Cancelled', 'Booking cancelled. Refund of ₹500 processed.');
                fetchBookings(); // Refresh list
              }
            } catch (error) {
              const message =
                error.response?.data?.message || 'Failed to cancel booking';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.booking_id.toString()}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancel={() => handleCancelBooking(item.booking_id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>
              Find a parking lot to make your first booking
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
});

export default MyBookingsScreen;
