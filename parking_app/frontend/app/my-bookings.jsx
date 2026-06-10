/**
 * My Bookings Screen
 * Displays all user bookings with status, cancel option
 */

import { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { bookingAPI } from '../services/api';
import BookingCard from '../components/BookingCard';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refundPolicyVisible, setRefundPolicyVisible] = useState(false);

  const navigation = useNavigation();

  // Place refund policy icon in the header top-right
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setRefundPolicyVisible(true)}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={require('../assets/refund.png')}
            style={{ width: 26, height: 26, tintColor: '#fff' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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
        const uniqueBookings = Array.from(
          new Map(response.data.data.map((booking) => [booking.booking_id, booking])).values()
        );
        setBookings(uniqueBookings);
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
      'Are you sure you want to cancel this booking? Refund depends on time left before expected start (100%, 80%, 60%, 40%, or 0%).',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bookingAPI.cancelBooking(bookingId);
              if (response.data.success) {
                const refundPercentage = Number(response.data?.data?.refund_percentage ?? 0);
                const refundAmount = Number(response.data?.data?.refund_amount ?? 0).toFixed(2);
                const cancellationCharge = Number(response.data?.data?.cancellation_charge ?? 0).toFixed(2);

                Alert.alert(
                  'Cancelled',
                  `Booking cancelled.\nRefund: ${refundPercentage}% (₹${refundAmount})\nCancellation charge: ₹${cancellationCharge}`
                );
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
      {/* Refund Policy Modal */}
      <Modal
        visible={refundPolicyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRefundPolicyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💸 Cancellation Refund Policy</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setRefundPolicyVisible(false)}
              />
            </View>
            <ScrollView style={styles.refundScroll}>
              <Text style={styles.refundIntro}>
                A deposit of <Text style={styles.refundHighlight}>₹500</Text> is collected at the time of booking.
                The refund amount depends on how far in advance you cancel:
              </Text>

              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Time Before Start</Text>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Refund</Text>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.4, textAlign: 'right' }]}>Amount</Text>
              </View>
              <Divider />

              <View style={[styles.tableRow, styles.rowGreen]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>24 hours or more</Text>
                <Text style={[styles.tableCell, styles.refundGreen, { flex: 1, textAlign: 'center' }]}>100%</Text>
                <Text style={[styles.tableCell, styles.refundGreen, { flex: 1.4, textAlign: 'right' }]}>₹500</Text>
              </View>
              <Divider />

              <View style={[styles.tableRow, styles.rowLightGreen]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>12 – 24 hours</Text>
                <Text style={[styles.tableCell, styles.refundLightGreen, { flex: 1, textAlign: 'center' }]}>80%</Text>
                <Text style={[styles.tableCell, styles.refundLightGreen, { flex: 1.4, textAlign: 'right' }]}>₹400</Text>
              </View>
              <Divider />

              <View style={[styles.tableRow, styles.rowOrange]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>8 – 12 hours</Text>
                <Text style={[styles.tableCell, styles.refundOrange, { flex: 1, textAlign: 'center' }]}>60%</Text>
                <Text style={[styles.tableCell, styles.refundOrange, { flex: 1.4, textAlign: 'right' }]}>₹300</Text>
              </View>
              <Divider />

              <View style={[styles.tableRow, styles.rowDarkOrange]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>4 – 8 hours</Text>
                <Text style={[styles.tableCell, styles.refundDarkOrange, { flex: 1, textAlign: 'center' }]}>40%</Text>
                <Text style={[styles.tableCell, styles.refundDarkOrange, { flex: 1.4, textAlign: 'right' }]}>₹200</Text>
              </View>
              <Divider />

              <View style={[styles.tableRow, styles.rowRed]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Less than 4 hours</Text>
                <Text style={[styles.tableCell, styles.refundRed, { flex: 1, textAlign: 'center' }]}>0%</Text>
                <Text style={[styles.tableCell, styles.refundRed, { flex: 1.4, textAlign: 'right' }]}>₹0</Text>
              </View>

              <View style={styles.refundNote}>
                <Text style={styles.refundNoteText}>
                  ℹ️  The deposit is fully refunded when your vehicle exits the lot after a completed booking.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

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


  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth - 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  refundScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  refundIntro: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 14,
    marginTop: 4,
  },
  refundHighlight: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  tableHead: {
    backgroundColor: '#37474f',
    borderRadius: 6,
    marginBottom: 2,
  },
  tableHeadText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableCell: {
    fontSize: 13,
    color: '#333',
    paddingHorizontal: 4,
  },
  rowGreen:      { backgroundColor: '#f1f8e9' },
  rowLightGreen: { backgroundColor: '#f9fbe7' },
  rowOrange:     { backgroundColor: '#fff8e1' },
  rowDarkOrange: { backgroundColor: '#fff3e0' },
  rowRed:        { backgroundColor: '#fce4ec' },
  refundGreen:      { color: '#2e7d32', fontWeight: 'bold' },
  refundLightGreen: { color: '#558b2f', fontWeight: 'bold' },
  refundOrange:     { color: '#f57f17', fontWeight: 'bold' },
  refundDarkOrange: { color: '#e65100', fontWeight: 'bold' },
  refundRed:        { color: '#c62828', fontWeight: 'bold' },
  refundNote: {
    marginTop: 14,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  refundNoteText: {
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 18,
  },
});
