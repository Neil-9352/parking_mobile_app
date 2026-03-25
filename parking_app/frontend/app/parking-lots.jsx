/**
 * Parking Lots Screen
 *
 * Receives start_time / end_time from DateSelectionScreen via search params.
 * Fetches lots with date-aware availability and displays them.
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { parkingAPI } from '../services/api';
import ParkingCard from '../components/ParkingCard';

export default function ParkingLotsScreen() {
  const router = useRouter();
  const { start_time, end_time, display_start, display_end } = useLocalSearchParams();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await parkingAPI.getLots(start_time, end_time);
      if (response.data.success) {
        setLots(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLots();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Finding available lots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected duration banner */}
      <Surface style={styles.durationCard} elevation={2}>
        <Text style={styles.durationTitle}>🕐 Your Parking Duration</Text>
        <View style={styles.durationRow}>
          <Chip icon="clock-start" style={styles.chip} textStyle={styles.chipText}>
            {display_start}
          </Chip>
        </View>
        <View style={styles.durationRow}>
          <Chip icon="clock-end" style={styles.chip} textStyle={styles.chipText}>
            {display_end}
          </Chip>
        </View>
      </Surface>

      {/* Lots List */}
      <FlatList
        data={lots}
        keyExtractor={(item) => item.lot_id.toString()}
        renderItem={({ item }) => (
          <ParkingCard
            lot={item}
            onPress={() =>
              router.push({
                pathname: `/slot-selection/${item.lot_id}`,
                params: {
                  lot_name: item.lot_name,
                  layout_image_path: item.layout_image_path || '',
                  start_time,
                  end_time,
                },
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🅿️</Text>
            <Text style={styles.emptyText}>No parking lots available</Text>
          </View>
        }
      />
    </View>
  );
}

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
  durationCard: {
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },
  durationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  durationRow: {
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
