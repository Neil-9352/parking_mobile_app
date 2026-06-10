/**
 * ParkingCard Component
 * Reusable card for displaying parking lot info
 */

import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip } from 'react-native-paper';

const ParkingCard = ({ lot, onPress }) => {
  const availableSlots = parseInt(lot.available_slots) || 0;
  const totalSlots = parseInt(lot.total_slots) || 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.lotName}>{lot.lot_name}</Text>
            <Text style={styles.address}>📍 {lot.address}</Text>
          </View>
          <View style={styles.slotInfo}>
            <Text
              style={[
                styles.availableCount,
                { color: availableSlots > 0 ? '#4caf50' : '#f44336' },
              ]}
            >
              {availableSlots}
            </Text>
            <Text style={styles.slotLabel}>
              of {totalSlots} free
            </Text>
          </View>
        </View>
        <Chip
          style={[
            styles.statusChip,
            {
              backgroundColor:
                availableSlots > 0 ? '#e8f5e9' : '#ffebee',
            },
          ]}
          textStyle={{
            color: availableSlots > 0 ? '#4caf50' : '#f44336',
            fontSize: 12,
          }}
        >
          {availableSlots > 0 ? 'Slots Available' : 'Full'}
        </Chip>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  lotName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  slotInfo: {
    alignItems: 'center',
  },
  availableCount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  slotLabel: {
    fontSize: 11,
    color: '#888',
  },
  statusChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});

export default ParkingCard;
