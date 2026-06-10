/**
 * Register Screen
 * User registration with name, username, password, and phone
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({ name, username, password, phone });

      if (response.data.success) {
        Alert.alert('Success', 'Account created successfully! Please login.', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🚗</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join iParking today</Text>
          </View>

          {/* Register Form */}
          <Surface style={styles.card} elevation={4}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="account-circle" />}
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

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>

            <Button
              mode="text"
              onPress={() => router.replace('/')}
              style={styles.linkButton}
            >
              Already have an account? Login
            </Button>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    fontSize: 28,
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
