/**
 * Booking Screen
 * Confirmation screen — shows selected slot + times, user picks vehicle, then confirms
 * Times are passed from SlotSelectionScreen (already selected via date picker)
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native-paper';
import { vehicleAPI, bookingAPI } from '../services/api';

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

const BookingScreen = ({ route, navigation }) => {
  const {
    slot_id,
    slot_no,
    lot_id,
    lot_name,
    start_time,
    end_time,
    fee_rules = [],
  } = route.params;
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(true);

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

  const handleConfirmBooking = async () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle. Add one from the Vehicles screen if needed.');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Slot #${slot_no} at ${lot_name}\nVehicle: ${selectedVehicle}\nExpected Parking Charge: ${formatCurrency(expectedParkingCharge)}\nDeposit: ₹${BOOKING_DEPOSIT}\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await bookingAPI.createBooking({
                registration_number: selectedVehicle,
                slot_id,
                expected_start_time: start_time,
                expected_end_time: end_time,
              });

              if (response.data.success) {
                Alert.alert(
                  'Booking Confirmed! ✅',
                  `Your slot #${slot_no} at ${lot_name} has been booked.\nExpected Parking Charge: ${formatCurrency(expectedParkingCharge)}\nDeposit: ₹${BOOKING_DEPOSIT}`,
                  [
                    {
                      text: 'View Bookings',
                      onPress: () => navigation.navigate('MyBookings'),
                    },
                  ]
                );
              }
            } catch (error) {
              const message =
                error.response?.data?.message || 'Booking failed. Please try again.';
              Alert.alert('Booking Failed', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
              onPress={() => navigation.navigate('Vehicles')}
              style={styles.addVehicleBtn}
            >
              Add Vehicle
            </Button>
          </View>
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
          💡 This deposit is fully refundable when your vehicle exits the lot
        </Text>
      </Surface>

      {/* Confirm Button */}
      <Button
        mode="contained"
        onPress={handleConfirmBooking}
        loading={loading}
        disabled={loading || vehicles.length === 0}
        style={styles.confirmButton}
        contentStyle={styles.confirmButtonContent}
        icon="check-circle"
      >
        {loading ? 'Processing...' : 'Confirm Booking'}
      </Button>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

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
  confirmButton: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default BookingScreen;
