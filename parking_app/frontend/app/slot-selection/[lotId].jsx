/**
 * Slot Selection Screen — Dynamic Route [lotId]
 *
 * Shows slot grid for a lot. Availability is determined by
 * time-based overlap checks (from the backend), NOT parking_slot.status.
 *
 * Has a "View Parking Lot Layout" button that shows the lot layout image.
 * Has a "View Refund Policy" button at the bottom showing the cancellation
 * refund tiers in a formatted table.
 *
 * Color coding:
 *   green → available (no overlapping booking)
 *   red   → unavailable (overlapping ACTIVE booking exists)
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, Surface, Button, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { parkingAPI, API_HOST } from '../../services/api';

export default function SlotSelectionScreen() {
  const router = useRouter();
  const { lotId, lot_name, layout_image_path, start_time, end_time } = useLocalSearchParams();

  const [slots, setSlots] = useState([]);
  const [feeRules, setFeeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layoutVisible, setLayoutVisible] = useState(false);
  const [refundPolicyVisible, setRefundPolicyVisible] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await parkingAPI.getSlots(lotId, start_time, end_time);
      if (response.data.success) {
        setSlots(response.data.data.slots);
        setFeeRules(response.data.data.fee_rules || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotPress = (slot) => {
    if (!slot.available) {
      Alert.alert(
        'Unavailable',
        'This slot is already booked for the selected time. Please choose another slot.'
      );
      return;
    }

    router.push({
      pathname: `/booking/${slot.slot_id}`,
      params: {
        slot_no: slot.slot_no,
        lot_id: lotId,
        lot_name,
        start_time,
        end_time,
        fee_rules: JSON.stringify(feeRules),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading slots...</Text>
      </View>
    );
  }

  // Layout images are served from /layouts on the backend (admin uploads directory)
  const layoutImageUrl = layout_image_path
    ? `${API_HOST}/layouts/${layout_image_path.replace(/^.*[\/\\]/, '')}`
    : null;

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <View style={styles.container}>
      {/* Lot Header */}
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.lotName}>{lot_name}</Text>
        <Text style={styles.lotInfo}>
          {availableCount} of {slots.length} slots available for selected time
        </Text>
      </Surface>

      {/* View Layout Button */}
      {layoutImageUrl && (
        <Button
          mode="contained"
          icon="floor-plan"
          onPress={() => setLayoutVisible(true)}
          style={styles.layoutButton}
          contentStyle={styles.layoutButtonContent}
        >
          View Parking Lot Layout
        </Button>
      )}

      {/* Layout Image Modal */}
      <Modal
        visible={layoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLayoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lot_name} — Layout</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setLayoutVisible(false)}
              />
            </View>
            {layoutImageUrl ? (
              <Image
                source={{ uri: layoutImageUrl }}
                style={styles.layoutImage}
                resizeMode="contain"
                onError={(e) => {
                  console.log('Image load error:', e.nativeEvent.error);
                  Alert.alert(
                    'Error',
                    'Could not load the layout image.',
                    [{ text: 'OK', onPress: () => setLayoutVisible(false) }]
                  );
                }}
              />
            ) : (
              <Text style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                No layout image available
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Refund Policy Modal */}
      <Modal
        visible={refundPolicyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRefundPolicyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💸 Cancellation Refund Policy</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setRefundPolicyVisible(false)}
              />
            </View>

            <ScrollView style={styles.refundScroll}>
              {/* Intro */}
              <Text style={styles.refundIntro}>
                A deposit of <Text style={styles.refundHighlight}>₹500</Text> is collected at the time of booking.
                The refund amount depends on how far in advance you cancel:
              </Text>

              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Time Before Start</Text>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Refund</Text>
                <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.4, textAlign: 'right' }]}>Amount</Text>
              </View>
              <Divider />

              {/* Row 1 */}
              <View style={[styles.tableRow, styles.rowGreen]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>24 hours or more</Text>
                <Text style={[styles.tableCell, styles.refundGreen, { flex: 1, textAlign: 'center' }]}>100%</Text>
                <Text style={[styles.tableCell, styles.refundGreen, { flex: 1.4, textAlign: 'right' }]}>₹500</Text>
              </View>
              <Divider />

              {/* Row 2 */}
              <View style={[styles.tableRow, styles.rowLightGreen]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>12 – 24 hours</Text>
                <Text style={[styles.tableCell, styles.refundLightGreen, { flex: 1, textAlign: 'center' }]}>80%</Text>
                <Text style={[styles.tableCell, styles.refundLightGreen, { flex: 1.4, textAlign: 'right' }]}>₹400</Text>
              </View>
              <Divider />

              {/* Row 3 */}
              <View style={[styles.tableRow, styles.rowOrange]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>8 – 12 hours</Text>
                <Text style={[styles.tableCell, styles.refundOrange, { flex: 1, textAlign: 'center' }]}>60%</Text>
                <Text style={[styles.tableCell, styles.refundOrange, { flex: 1.4, textAlign: 'right' }]}>₹300</Text>
              </View>
              <Divider />

              {/* Row 4 */}
              <View style={[styles.tableRow, styles.rowDarkOrange]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>4 – 8 hours</Text>
                <Text style={[styles.tableCell, styles.refundDarkOrange, { flex: 1, textAlign: 'center' }]}>40%</Text>
                <Text style={[styles.tableCell, styles.refundDarkOrange, { flex: 1.4, textAlign: 'right' }]}>₹200</Text>
              </View>
              <Divider />

              {/* Row 5 */}
              <View style={[styles.tableRow, styles.rowRed]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Less than 4 hours</Text>
                <Text style={[styles.tableCell, styles.refundRed, { flex: 1, textAlign: 'center' }]}>0%</Text>
                <Text style={[styles.tableCell, styles.refundRed, { flex: 1.4, textAlign: 'right' }]}>₹0</Text>
              </View>

              {/* Note */}
              <View style={styles.refundNote}>
                <Text style={styles.refundNoteText}>
                  ℹ️  The deposit is fully refunded when your vehicle exits the lot after a completed booking.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>

      {/* Slot Grid */}
      <FlatList
        data={slots}
        keyExtractor={(item) => item.slot_id.toString()}
        numColumns={4}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slotCard,
              { backgroundColor: item.available ? '#4caf50' : '#f44336' },
            ]}
            onPress={() => handleSlotPress(item)}
            activeOpacity={item.available ? 0.7 : 1}
          >
            <Text style={styles.slotNumber}>{item.slot_no}</Text>
            <Text style={styles.slotStatus}>
              {item.available ? '☑️' : '🚫'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No slots found for this lot</Text>
          </View>
        }
        ListFooterComponent={
          <Button
            mode="outlined"
            icon="cash-refund"
            onPress={() => setRefundPolicyVisible(true)}
            style={styles.refundPolicyButton}
            contentStyle={styles.refundPolicyButtonContent}
            textColor="#e65100"
          >
            View Refund Policy
          </Button>
        }
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
  },
  lotName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  lotInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  layoutButton: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#5c6bc0',
  },
  layoutButtonContent: {
    paddingVertical: 4,
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
  layoutImage: {
    width: '100%',
    height: screenWidth - 32,
  },
  // Legend & Grid
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  grid: {
    padding: 12,
  },
  slotCard: {
    flex: 1,
    margin: 6,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '23%',
    elevation: 2,
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  slotStatus: {
    fontSize: 16,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },

  // Refund Policy Button
  refundPolicyButton: {
    marginHorizontal: 6,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 8,
    borderColor: '#e65100',
  },
  refundPolicyButtonContent: {
    paddingVertical: 4,
  },

  // Refund Policy Modal
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
