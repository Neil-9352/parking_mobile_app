/**
 * Login Screen
 * User login with username and password
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    // Validate fields
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ username, password });

      if (response.data.success) {
        // Store token and user data
        await AsyncStorage.setItem('token', response.data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Navigate to Dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🚗</Text>
          <Text style={styles.title}>ParkEasy</Text>
          <Text style={styles.subtitle}>Smart Parking Management</Text>
        </View>

        {/* Login Form */}
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.cardTitle}>Welcome Back</Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secureText}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureText ? 'eye-off' : 'eye'}
                onPress={() => setSecureText(!secureText)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
          >
            Don't have an account? Register
          </Button>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 12,
  },
});

export default LoginScreen;
