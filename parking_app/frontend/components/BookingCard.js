/**
 * BookingCard Component
 * Reusable card for displaying a booking with cancel option
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';

const STATUS_COLORS = {
  ACTIVE: { bg: '#e3f2fd', text: '#1a73e8' },
  CANCELLED: { bg: '#ffebee', text: '#d32f2f' },
  COMPLETED: { bg: '#e8f5e9', text: '#4caf50' },
  NO_SHOW: { bg: '#fff3e0', text: '#ff9800' },
};

const REFUND_COLORS = {
  PENDING: { bg: '#fff3e0', text: '#ff9800' },
  REFUNDED: { bg: '#e8f5e9', text: '#4caf50' },
  NOT_APPLICABLE: { bg: '#f5f5f5', text: '#999' },
};

const BookingCard = ({ booking, onCancel }) => {
  const statusColor = STATUS_COLORS[booking.booking_status] || STATUS_COLORS.ACTIVE;
  const refundColor = REFUND_COLORS[booking.refund_status] || REFUND_COLORS.PENDING;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.lotName}>{booking.lot_name}</Text>
            <Text style={styles.slotInfo}>
              Slot #{booking.slot_no} • {booking.registration_number}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: statusColor.bg }]}
            textStyle={[styles.statusText, { color: statusColor.text }]}
          >
            {booking.booking_status}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Booked</Text>
          <Text style={styles.value}>{formatDate(booking.booking_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Start</Text>
          <Text style={styles.value}>{formatDate(booking.expected_start_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>End</Text>
          <Text style={styles.value}>{formatDate(booking.expected_end_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Deposit</Text>
          <Text style={styles.value}>₹{booking.booking_amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Refund</Text>
          <Chip
            style={[styles.refundChip, { backgroundColor: refundColor.bg }]}
            textStyle={[styles.refundText, { color: refundColor.text }]}
          >
            {booking.refund_status}
          </Chip>
        </View>

        {/* Cancel Button (only for ACTIVE bookings) */}
        {booking.booking_status === 'ACTIVE' && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
            textColor="#d32f2f"
            icon="close-circle"
          >
            Cancel Booking
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  slotInfo: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  label: {
    fontSize: 13,
    color: '#888',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  refundChip: {
    height: 26,
  },
  refundText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 12,
    borderColor: '#d32f2f',
    borderRadius: 8,
  },
});

export default BookingCard;
