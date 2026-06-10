/**
 * Date Selection Screen
 *
 * First step in the Find Parking flow.
 * User picks start and end date/time, then taps "Find Available Lots".
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

export default function DateSelectionScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [pickerTarget, setPickerTarget] = useState('start');

  // ── Picker helpers ──────────────────────────────────────────

  const openPicker = (target, mode) => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;

    if (pickerTarget === 'start') {
      const updated = new Date(startDate);
      if (pickerMode === 'date') {
        updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setStartDate(updated);
        // Adjust end date if it is now behind or equal to the new start
        setEndDate((prevEnd) => {
          if (prevEnd <= updated) {
            return new Date(updated.getTime() + 2 * 60 * 60 * 1000);
          }
          return prevEnd;
        });
        setTimeout(() => openPicker('start', 'time'), 300);
      } else {
        updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        // Clamp: start must be at least 1 hour from now
        const minStart = new Date(Date.now() + 60 * 60 * 1000);
        const clampedStart = updated < minStart ? minStart : updated;
        setStartDate(clampedStart);
        // Preserve the existing gap; if end is now behind, shift it forward
        setEndDate((prevEnd) => {
          if (prevEnd <= clampedStart) {
            // Keep the same gap the user had (min 1 hour)
            const gapMs = Math.max(endDate - startDate, 60 * 60 * 1000);
            return new Date(clampedStart.getTime() + gapMs);
          }
          return prevEnd;
        });
      }
    } else {
      const MIN_GAP_MS = 60 * 60 * 1000; // 1 hour
      const updated = new Date(endDate);
      if (pickerMode === 'date') {
        updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        // Clamp: end must be at least 1 hour after start
        const minEnd = new Date(startDate.getTime() + MIN_GAP_MS);
        setEndDate(updated < minEnd ? minEnd : updated);
        setTimeout(() => openPicker('end', 'time'), 300);
      } else {
        updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        // Clamp: end must be at least 1 hour after start
        const minEnd = new Date(startDate.getTime() + MIN_GAP_MS);
        setEndDate(updated < minEnd ? minEnd : updated);
      }
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (date) =>
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const formatForAPI = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  // ── Validation & navigation ─────────────────────────────────

  const handleFindParking = () => {
    const diffMs = endDate - startDate;
    if (diffMs < 60 * 60 * 1000) {
      Alert.alert('Invalid Duration', 'Parking duration must be at least 1 hour.');
      return;
    }

    router.push({
      pathname: '/parking-lots',
      params: {
        start_time: formatForAPI(startDate),
        end_time: formatForAPI(endDate),
        display_start: `${formatDate(startDate)}, ${formatTime(startDate)}`,
        display_end: `${formatDate(endDate)}, ${formatTime(endDate)}`,
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📅</Text>
          <Text style={styles.title}>When do you need parking?</Text>
          <Text style={styles.subtitle}>
            Select your parking duration to find available lots
          </Text>
        </View>

        {/* Date/Time Card */}
        <Surface style={styles.card} elevation={3}>
          {/* Start */}
          <Text style={styles.sectionLabel}>FROM</Text>
          <View style={styles.dateRow}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => openPicker('start', 'date')}
              style={styles.dateBtn}
              contentStyle={styles.dateBtnContent}
            >
              {formatDate(startDate)}
            </Button>
            <Button
              mode="outlined"
              icon="clock-outline"
              onPress={() => openPicker('start', 'time')}
              style={styles.timeBtn}
              contentStyle={styles.dateBtnContent}
            >
              {formatTime(startDate)}
            </Button>
          </View>

          {/* Arrow divider */}
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>↓</Text>
          </View>

          {/* End */}
          <Text style={styles.sectionLabel}>TO</Text>
          <View style={styles.dateRow}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => openPicker('end', 'date')}
              style={styles.dateBtn}
              contentStyle={styles.dateBtnContent}
            >
              {formatDate(endDate)}
            </Button>
            <Button
              mode="outlined"
              icon="clock-outline"
              onPress={() => openPicker('end', 'time')}
              style={styles.timeBtn}
              contentStyle={styles.dateBtnContent}
            >
              {formatTime(endDate)}
            </Button>
          </View>
        </Surface>

        {/* Native Picker */}
        {showPicker && (
          <DateTimePicker
            value={pickerTarget === 'start' ? startDate : endDate}
            mode={pickerMode}
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={pickerTarget === 'end' ? startDate : new Date(Date.now() + 60 * 60 * 1000)}
          />
        )}

        {/* Find Parking Button */}
        <Button
          mode="contained"
          onPress={handleFindParking}
          style={styles.findButton}
          contentStyle={styles.findButtonContent}
          icon="magnify"
        >
          Find Available Lots
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a73e8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flex: 3,
    borderColor: '#ddd',
  },
  timeBtn: {
    flex: 2,
    borderColor: '#ddd',
  },
  dateBtnContent: {
    paddingVertical: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
  findButton: {
    marginTop: 24,
    borderRadius: 10,
    backgroundColor: '#1a73e8',
  },
  findButtonContent: {
    paddingVertical: 8,
  },
});
