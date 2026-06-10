/**
 * BookingCard Component
 * Reusable card for displaying a booking with cancel option
 */

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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `₹${Number(value).toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(0)}%`;
  };

  // Converts SNAKE_CASE enum values to Title Case (e.g. NOT_APPLICABLE → Not Applicable)
  const formatStatus = (value) => {
    if (!value) return 'N/A';
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            {formatStatus(booking.booking_status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Booked</Text>
          <Text style={styles.value}>{formatDate(booking.booking_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Expected Start</Text>
          <Text style={styles.value}>{formatDate(booking.expected_start_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Expected End</Text>
          <Text style={styles.value}>{formatDate(booking.expected_end_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Actual In</Text>
          <Text style={styles.value}>{formatDate(booking.actual_in_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Actual Out</Text>
          <Text style={styles.value}>{formatDate(booking.actual_out_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Deposit</Text>
          <Text style={styles.value}>{formatCurrency(booking.booking_amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Expected Parking Charge</Text>
          <Text style={styles.value}>{formatCurrency(booking.expected_parking_charge)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Actual Parking Charge</Text>
          <Text style={styles.value}>{formatCurrency(booking.actual_parking_charge)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Refund</Text>
          <Chip
            style={[styles.refundChip, { backgroundColor: refundColor.bg }]}
            textStyle={[styles.refundText, { color: refundColor.text }]}
          >
            {formatStatus(booking.refund_status)}
          </Chip>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Refund %</Text>
          <Text style={styles.value}>{formatPercentage(booking.refund_percentage)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Refund Amount</Text>
          <Text style={styles.value}>{formatCurrency(booking.refund_amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Cancellation Charge</Text>
          <Text style={styles.value}>{formatCurrency(booking.cancellation_charge)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Cancelled At</Text>
          <Text style={styles.value}>{formatDate(booking.cancellation_time)}</Text>
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
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
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
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  refundText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  cancelButton: {
    marginTop: 12,
    borderColor: '#d32f2f',
    borderRadius: 8,
  },
});

export default BookingCard;
