/**
 * Dashboard Screen
 * Main hub showing quick actions: My Bookings, Parking Lots, Vehicles, Receipts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Surface,
  Divider,
  Badge,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingAPI, vehicleAPI } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalVehicles: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [bookingsRes, vehiclesRes] = await Promise.all([
        bookingAPI.getMyBookings(),
        vehicleAPI.getMyVehicles(),
      ]);

      const activeBookings = bookingsRes.data.data.filter(
        (b) => b.booking_status === 'ACTIVE'
      ).length;

      setStats({
        activeBookings,
        totalVehicles: vehiclesRes.data.data.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <Surface style={styles.welcomeCard} elevation={2}>
        <Text style={styles.greeting}>
          Hello, {user?.name || 'User'} 👋
        </Text>
        <Text style={styles.welcomeText}>
          What would you like to do today?
        </Text>
      </Surface>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Surface style={[styles.statCard, { backgroundColor: '#e3f2fd' }]} elevation={1}>
          <Text style={styles.statNumber}>{stats.activeBookings}</Text>
          <Text style={styles.statLabel}>Active Bookings</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#e8f5e9' }]} elevation={1}>
          <Text style={styles.statNumber}>{stats.totalVehicles}</Text>
          <Text style={styles.statLabel}>My Vehicles</Text>
        </Surface>
      </View>

      <Divider style={styles.divider} />

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <Card
        style={styles.actionCard}
        onPress={() => navigation.navigate('DateSelection')}
      >
        <Card.Content style={styles.actionContent}>
          <Text style={styles.actionEmoji}>🅿️</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Find Parking</Text>
            <Text style={styles.actionSubtitle}>
              Browse available parking lots & book a slot
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card
        style={styles.actionCard}
        onPress={() => navigation.navigate('MyBookings')}
      >
        <Card.Content style={styles.actionContent}>
          <Text style={styles.actionEmoji}>📋</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>My Bookings</Text>
            <Text style={styles.actionSubtitle}>
              View and manage your parking bookings
            </Text>
          </View>
          {stats.activeBookings > 0 && (
            <Badge style={styles.badge}>{stats.activeBookings}</Badge>
          )}
        </Card.Content>
      </Card>

      <Card
        style={styles.actionCard}
        onPress={() => navigation.navigate('Vehicles')}
      >
        <Card.Content style={styles.actionContent}>
          <Text style={styles.actionEmoji}>🚘</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>My Vehicles</Text>
            <Text style={styles.actionSubtitle}>
              Manage your registered vehicles
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card
        style={styles.actionCard}
        onPress={() => navigation.navigate('Receipts')}
      >
        <Card.Content style={styles.actionContent}>
          <Text style={styles.actionEmoji}>🧾</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Receipts</Text>
            <Text style={styles.actionSubtitle}>
              View parking receipts & download
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#d32f2f"
        icon="logout"
      >
        Logout
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
  welcomeCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1a73e8',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#1a73e8',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderColor: '#d32f2f',
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default DashboardScreen;
