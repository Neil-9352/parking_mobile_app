/**
 * Receipts Screen
 * Displays parking receipts (from parks_in table) with download option
 */

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { receiptAPI } from '../services/api';

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      const response = await receiptAPI.getUserReceipts(user.id);
      if (response.data.success) {
        setReceipts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const handleDownloadReceipt = (receiptPath) => {
    if (receiptPath) {
      Linking.openURL(receiptPath).catch(() => {
        Alert.alert('Error', 'Unable to open receipt');
      });
    } else {
      Alert.alert('Info', 'Receipt not available yet');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading receipts...</Text>
      </View>
    );
  }

  const renderReceipt = ({ item }) => (
    <Card style={styles.receiptCard}>
      <Card.Content>
        <View style={styles.receiptHeader}>
          <Text style={styles.vehicleNo}>{item.registration_number}</Text>
          {item.fee && (
            <Chip style={styles.feeChip} textStyle={styles.feeChipText}>
              ₹{item.fee}
            </Chip>
          )}
        </View>
        <Divider style={styles.divider} />
        <View style={styles.receiptRow}>
          <Text style={styles.label}>Lot</Text>
          <Text style={styles.value}>{item.lot_name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.label}>Slot</Text>
          <Text style={styles.value}>#{item.slot_no}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.label}>Entry Time</Text>
          <Text style={styles.value}>{formatDateTime(item.in_time)}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.label}>Exit Time</Text>
          <Text style={styles.value}>{formatDateTime(item.out_time)}</Text>
        </View>
        {item.receipt_path && (
          <Button
            mode="outlined"
            onPress={() => handleDownloadReceipt(item.receipt_path)}
            icon="download"
            style={styles.downloadBtn}
          >
            Download Receipt
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReceipt}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyText}>No receipts yet</Text>
            <Text style={styles.emptySubtext}>
              Receipts appear after parking is completed
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 60 },
  loadingText: { marginTop: 10, color: '#666' },
  listContent: { padding: 16 },
  receiptCard: { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff' },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleNo: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  feeChip: { backgroundColor: '#e8f5e9' },
  feeChipText: { color: '#4caf50', fontWeight: 'bold' },
  divider: { marginVertical: 10 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, fontWeight: '600', color: '#333' },
  downloadBtn: { marginTop: 12, borderColor: '#1a73e8' },
  emptyEmoji: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#888' },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
});
