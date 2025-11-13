import { useEvents } from '@/contexts/EventContext';
import { Moment, MomentTag } from '@/types';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, FileText, Image as ImageIcon, Mic, StopCircle } from 'lucide-react-native';
import { useCallback, useState, useRef } from 'react';
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
import { useMutation } from '@tanstack/react-query';

const MOMENT_TAGS: MomentTag[] = ['Networking', 'Learning', 'Inspiration', 'Fun'];

export default function AddMomentScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { addMoment } = useEvents();

  const [selectedType, setSelectedType] = useState<'text' | 'photo' | 'voice'>('text');
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<MomentTag[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUri, setVoiceUri] = useState<string | undefined>();
  const recordingRef = useRef<Audio.Recording | null>(null);

  const transcribeMutation = useMutation({
    mutationFn: async (audioUri: string) => {
      const formData = new FormData();
      
      const uriParts = audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri: audioUri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;
      
      formData.append('audio', audioFile);

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      return data.text;
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.outputFormat,
          audioEncoder: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.audioEncoder,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios.outputFormat,
          audioQuality: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios.audioQuality,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setVoiceUri(uri);
        const transcription = await transcribeMutation.mutateAsync(uri);
        setContent(transcription);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setSelectedType('photo');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permission.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setSelectedType('photo');
    }
  }, []);

  const toggleTag = (tag: MomentTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!content.trim() && !photoUri) {
      Alert.alert('Missing Content', 'Please add some content to your moment');
      return;
    }

    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing');
      return;
    }

    const moment: Moment = {
      id: `moment_${Date.now()}`,
      eventId: eventId,
      type: selectedType,
      content: content.trim(),
      tags: selectedTags,
      timestamp: Date.now(),
      photoUri,
      voiceUri,
    };

    addMoment(moment);
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
          <View style={styles.typeSelector}>
            <Pressable
              style={[
                styles.typeButton,
                selectedType === 'text' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('text')}
            >
              <FileText size={20} color={selectedType === 'text' ? '#F97316' : '#6B7280'} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'text' && styles.typeButtonTextActive,
                ]}
              >
                Text
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeButton,
                selectedType === 'photo' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('photo')}
            >
              <ImageIcon size={20} color={selectedType === 'photo' ? '#F97316' : '#6B7280'} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'photo' && styles.typeButtonTextActive,
                ]}
              >
                Photo
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeButton,
                selectedType === 'voice' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('voice')}
            >
              <Mic size={20} color={selectedType === 'voice' ? '#F97316' : '#6B7280'} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'voice' && styles.typeButtonTextActive,
                ]}
              >
                Voice
              </Text>
            </Pressable>
          </View>

          {selectedType === 'photo' && (
            <View style={styles.photoActions}>
              <Pressable style={styles.photoButton} onPress={takePhoto}>
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </Pressable>
              <Pressable style={styles.photoButton} onPress={pickImage}>
                <ImageIcon size={20} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </Pressable>
            </View>
          )}

          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="cover" />
          )}

          {selectedType === 'voice' && (
            <View style={styles.voiceRecorder}>
              {!isRecording && !voiceUri && (
                <Pressable style={styles.recordButton} onPress={startRecording}>
                  <Mic size={24} color="#FFFFFF" />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </Pressable>
              )}

              {isRecording && (
                <Pressable style={styles.stopButton} onPress={stopRecording}>
                  <StopCircle size={24} color="#FFFFFF" />
                  <Text style={styles.stopButtonText}>Stop Recording</Text>
                </Pressable>
              )}

              {voiceUri && !isRecording && (
                <View style={styles.recordingComplete}>
                  <Mic size={24} color="#10B981" />
                  <Text style={styles.recordingCompleteText}>Recording complete</Text>
                  {transcribeMutation.isPending && (
                    <Text style={styles.transcribingText}>Transcribing...</Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.contentInput}>
            <Text style={styles.label}>
              {selectedType === 'voice' ? 'Transcription' : 'Description'}
            </Text>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder={
                selectedType === 'voice'
                  ? 'Recording will be transcribed here...'
                  : 'What happened? What did you learn?'
              }
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={selectedType !== 'voice' || !transcribeMutation.isPending}
            />
          </View>

          <View style={styles.tagsSection}>
            <Text style={styles.label}>Tags (Optional)</Text>
            <View style={styles.tagsContainer}>
              {MOMENT_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && styles.tagButtonActive,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag) && styles.tagButtonTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Moment</Text>
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
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  typeButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#F97316',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#F97316',
    borderRadius: 12,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 20,
  },
  voiceRecorder: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F97316',
    borderRadius: 50,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderRadius: 50,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  recordingComplete: {
    alignItems: 'center',
    gap: 8,
  },
  recordingCompleteText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  transcribingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  contentInput: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 150,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tagButtonActive: {
    backgroundColor: '#F97316',
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tagButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F97316',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
