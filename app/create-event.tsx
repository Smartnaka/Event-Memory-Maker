import { useEvents } from '@/contexts/EventContext';
import { Event } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CreateEventScreen() {
  const router = useRouter();
  const { addEvent } = useEvents();
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const start = startDate.getTime();
    const end = endDate.getTime();

    if (start > end) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date');
      return;
    }

    const newEvent: Event = {
      id: `event_${Date.now()}`,
      name: name.trim(),
      location: location.trim(),
      purpose: purpose.trim(),
      startDate: start,
      endDate: end,
      coverPhotoUri,
      createdAt: Date.now(),
    };

    addEvent(newEvent);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {coverPhotoUri ? (
              <Image
                source={{ uri: coverPhotoUri }}
                style={styles.coverImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Calendar size={32} color="#9CA3AF" />
                <Text style={styles.imagePickerText}>Add Cover Photo</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Event Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Web Summit 2025"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Lisbon, Portugal"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, styles.dateInput]}>
                <Text style={styles.label}>
                  Start Date <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Calendar size={18} color="#6B7280" />
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </Pressable>
                {showStartPicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowStartPicker(Platform.OS === 'ios');
                      if (date) setStartDate(date);
                    }}
                  />
                )}
                {showStartPicker && Platform.OS === 'web' && (
                  <input
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setStartDate(newDate);
                      }
                      setShowStartPicker(false);
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 48,
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, styles.dateInput]}>
                <Text style={styles.label}>
                  End Date <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Calendar size={18} color="#6B7280" />
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </Pressable>
                {showEndPicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowEndPicker(Platform.OS === 'ios');
                      if (date) setEndDate(date);
                    }}
                  />
                )}
                {showEndPicker && Platform.OS === 'web' && (
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setEndDate(newDate);
                      }
                      setShowEndPicker(false);
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 48,
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose / Goals</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={purpose}
                onChangeText={setPurpose}
                placeholder="What do you want to achieve at this event?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.createButton]}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Create Event</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    position: 'relative' as const,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#F97316',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
