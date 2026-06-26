/**
 * Booking Screen — Dynamic Route [slotId]
 *
 * Razorpay payment flow:
 *  1. User selects vehicle and taps "Pay Deposit ₹500"
 *  2. Backend creates a Razorpay order (POST /api/bookings/create-order)
 *  3. Native Razorpay checkout sheet opens (react-native-razorpay)
 *  4a. Success → Backend verifies signature + creates ACTIVE booking
 *  4b. Failure/Dismiss → Backend cleans up PAYMENT_PENDING row → prompt to retry or cancel
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  RadioButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { vehicleAPI, bookingAPI } from '../../services/api';

const BOOKING_DEPOSIT = 500;

const calculateExpectedCharge = ({ startTime, endTime, firstHourCharge, restHourCharge }) => {
  const start = new Date(startTime.replace(' ', 'T'));
  const end = new Date(endTime.replace(' ', 'T'));

  const durationMinutes = Math.max(0, Math.ceil((end - start) / (1000 * 60)));

  if (durationMinutes <= 60) {
    return Number(firstHourCharge);
  }

  const extraMinutes = durationMinutes - 60;
  const extraHours = Math.ceil(extraMinutes / 60);

  return Number(firstHourCharge) + (extraHours * Number(restHourCharge));
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const slotId = parseInt(params.slotId, 10);
  const slot_no = parseInt(params.slot_no, 10);
  const lot_id = parseInt(params.lot_id, 10);
  const lot_name = params.lot_name;
  const start_time = params.start_time;
  const end_time = params.end_time;

  let fee_rules = [];
  try {
    fee_rules = params.fee_rules ? JSON.parse(params.fee_rules) : [];
  } catch (e) {
    fee_rules = [];
  }

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle'); // 'idle' | 'creating_order' | 'awaiting_payment' | 'confirming'
  const [fetchingVehicles, setFetchingVehicles] = useState(true);

  // Hold onto the pending booking_id across the async Razorpay callback
  const pendingBookingIdRef = useRef(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getMyVehicles();
      if (response.data.success) {
        setVehicles(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedVehicle(response.data.data[0].registration_number);
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setFetchingVehicles(false);
    }
  };

  const formatDisplay = (dateStr) => {
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return `₹${Number(value).toFixed(2)}`;
  };

  const selectedVehicleData = vehicles.find((v) => v.registration_number === selectedVehicle);
  const selectedVehicleType = selectedVehicleData?.type;
  const selectedFeeRule = fee_rules.find((rule) => rule.vehicle_type === selectedVehicleType);

  const expectedParkingCharge = selectedFeeRule
    ? calculateExpectedCharge({
      startTime: start_time,
      endTime: end_time,
      firstHourCharge: selectedFeeRule.first_hour_charge,
      restHourCharge: selectedFeeRule.rest_hour_charge,
    })
    : null;

  const isProcessing = paymentStep !== 'idle';

  /**
   * Cleans up a stale PAYMENT_PENDING row on the backend.
   * Called when the Razorpay SDK fails or the user dismisses the sheet.
   */
  const cleanupPendingBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      await bookingAPI.handlePaymentFailed(bookingId);
    } catch (err) {
      // Cleanup is best-effort; the server-side cron job will catch any that slip through
      console.warn('[Booking] Failed to cleanup pending booking:', err?.message);
    }
  };

  /**
   * Shows the retry/cancel dialog after a payment failure.
   */
  const showPaymentFailureDialog = (bookingId, errorDescription) => {
    Alert.alert(
      'Payment Failed',
      errorDescription || 'The payment could not be completed. Would you like to try again?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setPaymentStep('idle');
          },
        },
        {
          text: 'Try Again',
          onPress: () => {
            setPaymentStep('idle');
            // Re-trigger the payment flow
            initiatePayment();
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * Main payment flow:
   *  1. Create Razorpay order on the backend
   *  2. Open native checkout sheet
   *  3a. On success → confirm booking on backend
   *  3b. On failure → cleanup pending row → show retry dialog
   */
  const initiatePayment = async () => {
    if (!selectedVehicle) {
      Alert.alert('No Vehicle Selected', 'Please select a vehicle to continue.');
      return;
    }

    try {
      // --- Step 1: Create Razorpay order ---
      setPaymentStep('creating_order');
      const orderResponse = await bookingAPI.createOrder();

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      const { order_id, key_id, amount, currency } = orderResponse.data.data;

      // --- Step 2: Open Razorpay native checkout ---
      setPaymentStep('awaiting_payment');

      const options = {
        description: `Parking deposit for Slot #${slot_no} at ${lot_name}`,
        currency: currency || 'INR',
        key: key_id,
        amount: String(amount), // in paise
        order_id,
        name: 'iParking',
        prefill: {
          // Razorpay will pre-fill these in the checkout sheet
          contact: '',
          email: '',
        },
        theme: { color: '#1a73e8' },
      };

      let paymentData;
      try {
        paymentData = await RazorpayCheckout.open(options);
      } catch (sdkError) {
        // SDK failure or user dismissed — cleanup the pending slot hold
        // Note: no pending booking row yet at this point since we haven't called /create
        setPaymentStep('idle');
        showPaymentFailureDialog(
          null,
          sdkError?.description || sdkError?.error?.description || 'Payment was cancelled or failed.'
        );
        return;
      }

      // --- Step 3: Confirm booking with payment proof ---
      setPaymentStep('confirming');

      const bookingResponse = await bookingAPI.createBooking({
        registration_number: selectedVehicle,
        slot_id: slotId,
        expected_start_time: start_time,
        expected_end_time: end_time,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      if (bookingResponse.data.success) {
        setPaymentStep('idle');
        Alert.alert(
          'Booking Confirmed! ✅',
          `Your slot #${slot_no} at ${lot_name} has been booked.\nPayment ID: ${paymentData.razorpay_payment_id}\nExpected Parking Charge: ${formatCurrency(expectedParkingCharge)}\nDeposit Paid: ₹${BOOKING_DEPOSIT}`,
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/my-bookings'),
            },
          ]
        );
      }
    } catch (error) {
      // Backend confirmation failed — the slot was held but signature verification
      // or DB insert failed; the cleanup job will sweep it within 10 minutes.
      setPaymentStep('idle');
      const message = error.response?.data?.message || 'Booking confirmation failed. Please contact support if your payment was deducted.';
      Alert.alert('Booking Failed', message);
    }
  };

  /**
   * Shows a confirmation dialog before initiating payment.
   */
  const handlePayDepositPress = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle. Add one from the Vehicles screen if needed.');
      return;
    }

    Alert.alert(
      'Confirm & Pay',
      `Slot #${slot_no} at ${lot_name}\nVehicle: ${selectedVehicle}\nExpected Parking Charge: ${formatCurrency(expectedParkingCharge)}\n\nYou will be charged a refundable deposit of ₹${BOOKING_DEPOSIT} now.\n\nProceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay ₹500',
          onPress: initiatePayment,
        },
      ]
    );
  };

  const getButtonLabel = () => {
    switch (paymentStep) {
      case 'creating_order': return 'Creating Order...';
      case 'awaiting_payment': return 'Awaiting Payment...';
      case 'confirming': return 'Confirming Booking...';
      default: return 'Pay Deposit ₹500';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Booking Summary */}
      <Surface style={styles.infoCard} elevation={2}>
        <Text style={styles.cardTitle}>Booking Summary</Text>
        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Parking Lot</Text>
          <Text style={styles.value}>{lot_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Slot Number</Text>
          <Text style={styles.value}>#{slot_no}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Start Time</Text>
          <Text style={styles.value}>{formatDisplay(start_time)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>End Time</Text>
          <Text style={styles.value}>{formatDisplay(end_time)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expected Parking Charge</Text>
          <Text style={styles.value}>{formatCurrency(expectedParkingCharge)}</Text>
        </View>
      </Surface>

      {/* Vehicle Selection */}
      <Surface style={styles.infoCard} elevation={2}>
        <Text style={styles.cardTitle}>Select Vehicle</Text>
        <Divider style={styles.divider} />

        {vehicles.length === 0 && !fetchingVehicles ? (
          <View>
            <Text style={styles.noVehicleText}>
              No vehicles registered. Please add a vehicle first.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/vehicles')}
              style={styles.addVehicleBtn}
            >
              Add Vehicle
            </Button>
          </View>
        ) : fetchingVehicles ? (
          <ActivityIndicator style={styles.activityIndicator} />
        ) : (
          <RadioButton.Group
            onValueChange={setSelectedVehicle}
            value={selectedVehicle}
          >
            {vehicles.map((vehicle) => (
              <RadioButton.Item
                key={vehicle.registration_number}
                label={`${vehicle.registration_number} (${vehicle.type})`}
                value={vehicle.registration_number}
                style={styles.radioItem}
                disabled={isProcessing}
              />
            ))}
          </RadioButton.Group>
        )}
      </Surface>

      {/* Deposit Info */}
      <Surface style={styles.depositCard} elevation={2}>
        <View style={styles.depositRow}>
          <Text style={styles.depositLabel}>Expected Parking Charge</Text>
          <Text style={styles.depositAmount}>{formatCurrency(expectedParkingCharge)}</Text>
        </View>
        <Text style={styles.depositNote}>
          Estimated from lot fee rules for your selected duration and vehicle type
        </Text>

        <Divider style={styles.depositDivider} />

        <View style={styles.depositRow}>
          <Text style={styles.depositLabel}>Booking Deposit</Text>
          <Text style={styles.depositAmount}>₹{BOOKING_DEPOSIT}</Text>
        </View>
        <Text style={styles.depositNote}>
          💡 Paid now via Razorpay. Fully refundable when your vehicle exits the lot.
        </Text>
      </Surface>

      {/* Payment Status Banner (shown during processing) */}
      {isProcessing && (
        <Surface style={styles.statusBanner} elevation={1}>
          <ActivityIndicator size="small" color="#1a73e8" style={styles.statusSpinner} />
          <Text style={styles.statusText}>{getButtonLabel()}</Text>
        </Surface>
      )}

      {/* Pay Button */}
      <Button
        mode="contained"
        onPress={handlePayDepositPress}
        loading={isProcessing}
        disabled={isProcessing || vehicles.length === 0 || fetchingVehicles}
        style={styles.confirmButton}
        contentStyle={styles.confirmButtonContent}
        icon={isProcessing ? undefined : 'lock'}
      >
        {getButtonLabel()}
      </Button>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoCard: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  radioItem: {
    paddingVertical: 2,
  },
  noVehicleText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
  addVehicleBtn: {
    marginTop: 8,
    backgroundColor: '#1a73e8',
  },
  activityIndicator: {
    marginVertical: 12,
  },
  depositCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff8e1',
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  depositAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  depositNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  depositDivider: {
    marginVertical: 10,
  },
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e8f0fe',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSpinner: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  confirmButton: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 30,
  },
});
