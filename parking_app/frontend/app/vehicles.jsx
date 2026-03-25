/**
 * Vehicle Screen
 * Add new vehicles and view existing registered vehicles
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Surface,
  RadioButton,
  Divider,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { vehicleAPI } from '../services/api';

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('4-wheeler');
  const [adding, setAdding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getMyVehicles();
      if (response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!regNumber.trim()) {
      Alert.alert('Error', 'Please enter vehicle registration number');
      return;
    }

    setAdding(true);
    try {
      const response = await vehicleAPI.addVehicle({
        registration_number: regNumber.toUpperCase(),
        type: vehicleType,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Vehicle registered successfully');
        setRegNumber('');
        setShowAddForm(false);
        fetchVehicles();
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to add vehicle';
      Alert.alert('Error', message);
    } finally {
      setAdding(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAddForm ? (
        <Surface style={styles.formCard} elevation={3}>
          <Text style={styles.formTitle}>Register New Vehicle</Text>
          <Divider style={styles.divider} />
          <TextInput
            label="Registration Number"
            value={regNumber}
            onChangeText={setRegNumber}
            mode="outlined"
            autoCapitalize="characters"
            placeholder="e.g. KA01AB1234"
            style={styles.input}
            left={<TextInput.Icon icon="car" />}
          />
          <Text style={styles.typeLabel}>Vehicle Type</Text>
          <RadioButton.Group onValueChange={setVehicleType} value={vehicleType}>
            <RadioButton.Item label="🏍️  2-Wheeler" value="2-wheeler" />
            <RadioButton.Item label="🚗  4-Wheeler" value="4-wheeler" />
          </RadioButton.Group>
          <View style={styles.formActions}>
            <Button mode="outlined" onPress={() => setShowAddForm(false)} style={styles.cancelBtn}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddVehicle} loading={adding} disabled={adding} style={styles.addBtn}>
              Add Vehicle
            </Button>
          </View>
        </Surface>
      ) : (
        <Button mode="contained" onPress={() => setShowAddForm(true)} icon="plus" style={styles.addButton}>
          Add New Vehicle
        </Button>
      )}

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.registration_number}
        renderItem={({ item }) => (
          <Card style={styles.vehicleCard}>
            <Card.Content style={styles.vehicleContent}>
              <View>
                <Text style={styles.vehicleNumber}>{item.registration_number}</Text>
              </View>
              <Chip icon={item.type === '2-wheeler' ? 'motorbike' : 'car'} style={styles.typeChip}>
                {item.type}
              </Chip>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🚘</Text>
            <Text style={styles.emptyText}>No vehicles registered</Text>
            <Text style={styles.emptySubtext}>Add a vehicle to start booking parking</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 40 },
  loadingText: { marginTop: 10, color: '#666' },
  addButton: { margin: 16, borderRadius: 8, backgroundColor: '#1a73e8' },
  formCard: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  divider: { marginVertical: 10 },
  input: { marginBottom: 10 },
  typeLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { borderColor: '#ccc' },
  addBtn: { backgroundColor: '#4caf50' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  vehicleCard: { marginBottom: 10, borderRadius: 12, backgroundColor: '#fff' },
  vehicleContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  typeChip: { backgroundColor: '#e3f2fd' },
  emptyEmoji: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#888' },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
});
