
import { useEvents, useEventById } from '@/contexts/EventContext';
import { DailyRecap } from '@/types';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';

export default function DailyRecapScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const event = useEventById(eventId!);
  const { getEventMoments, getEventRecaps, addDailyRecap } = useEvents();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [generatedRecap, setGeneratedRecap] = useState<DailyRecap | null>(null);

  const moments = getEventMoments(eventId!);
  const existingRecaps = getEventRecaps(eventId!);

  const generateRecapMutation = useMutation({
    mutationFn: async (date: string) => {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).getTime();

      const dayMoments = moments.filter(
        m => m.timestamp >= startOfDay && m.timestamp <= endOfDay
      );

      if (dayMoments.length === 0) {
        throw new Error('No moments found for this date');
      }

      const momentsText = dayMoments
        .map(m => {
          let text = `- ${m.type} moment at ${new Date(m.timestamp).toLocaleTimeString()}`;
          if (m.content) text += `\n  Content: ${m.content}`;
          if (m.tags.length > 0) text += `\n  Tags: ${m.tags.join(', ')}`;
          return text;
        })
        .join('\n\n');

      const prompt = `Create a warm and engaging daily summary for an event called "${event?.name}".

Here are the moments captured today:
${momentsText}

Please provide:
1. A compelling summary paragraph that captures the essence of the day
2. 3-5 key takeaways (as bullet points)
3. The top 3 most memorable moments (as bullet points)
4. The emotional tone of the day (one word or short phrase)
5. Names of people met (if mentioned in the moments)

Format the response as JSON with this structure:
{
  "summary": "Engaging paragraph summary",
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
  "topMoments": ["moment 1", "moment 2", "moment 3"],
  "emotionalTone": "positive/inspiring/energetic/etc",
  "peopleMet": ["person 1", "person 2", ...]
}`;

      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const recap: DailyRecap = {
        id: `recap_${Date.now()}`,
        eventId: eventId!,
        date: startOfDay,
        summary: parsed.summary,
        keyTakeaways: parsed.keyTakeaways,
        topMoments: parsed.topMoments,
        emotionalTone: parsed.emotionalTone,
        peopleMet: parsed.peopleMet,
        generatedAt: Date.now(),
      };

      return recap;
    },
    onSuccess: (recap) => {
      setGeneratedRecap(recap);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to generate recap');
    },
  });

  const handleGenerateRecap = () => {
    generateRecapMutation.mutate(selectedDate);
  };

  const handleSaveRecap = () => {
    if (generatedRecap) {
      addDailyRecap(generatedRecap);
      Alert.alert('Success', 'Daily recap saved!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const existingRecap = existingRecaps.find(
    r => new Date(r.date).toISOString().split('T')[0] === selectedDate
  );

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Sparkles size={32} color="#F97316" />
          <Text style={styles.headerTitle}>Daily Recap</Text>
          <Text style={styles.headerSubtitle}>
            AI-generated summary of your event day
          </Text>
        </View>

        <View style={styles.dateSelector}>
          <Text style={styles.label}>Select Date</Text>
          <View style={styles.dateInput}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.dateText}>{selectedDate}</Text>
          </View>
          <Text style={styles.hint}>
            Showing moments from {selectedDate}
          </Text>
        </View>

        {existingRecap ? (
          <View style={styles.existingRecapContainer}>
            <Text style={styles.existingRecapTitle}>Recap already exists for this date</Text>
            <View style={styles.recapCard}>
              <Text style={styles.recapSummary}>{existingRecap.summary}</Text>
              
              <View style={styles.recapSection}>
                <Text style={styles.recapSectionTitle}>Key Takeaways</Text>
                {existingRecap.keyTakeaways.map((takeaway, idx) => (
                  <Text key={idx} style={styles.bulletPoint}>• {takeaway}</Text>
                ))}
              </View>

              <View style={styles.recapSection}>
                <Text style={styles.recapSectionTitle}>Top Moments</Text>
                {existingRecap.topMoments.map((moment, idx) => (
                  <Text key={idx} style={styles.bulletPoint}>• {moment}</Text>
                ))}
              </View>

              <View style={styles.emotionalToneContainer}>
                <Text style={styles.emotionalToneLabel}>Emotional Tone:</Text>
                <Text style={styles.emotionalTone}>{existingRecap.emotionalTone}</Text>
              </View>

              {existingRecap.peopleMet.length > 0 && (
                <View style={styles.recapSection}>
                  <Text style={styles.recapSectionTitle}>People Met</Text>
                  <Text style={styles.peopleMet}>
                    {existingRecap.peopleMet.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <>
            {!generatedRecap && !generateRecapMutation.isPending && (
              <View style={styles.generateContainer}>
                <Text style={styles.generateDescription}>
                  Generate an AI-powered summary of all moments captured on {selectedDate}
                </Text>
                <Pressable
                  style={styles.generateButton}
                  onPress={handleGenerateRecap}
                  disabled={generateRecapMutation.isPending}
                >
                  <Sparkles size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Generate Recap</Text>
                </Pressable>
              </View>
            )}

            {generateRecapMutation.isPending && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Generating your recap...</Text>
              </View>
            )}

            {generatedRecap && (
              <View style={styles.recapContainer}>
                <View style={styles.recapCard}>
                  <Text style={styles.recapSummary}>{generatedRecap.summary}</Text>
                  
                  <View style={styles.recapSection}>
                    <Text style={styles.recapSectionTitle}>Key Takeaways</Text>
                    {generatedRecap.keyTakeaways.map((takeaway, idx) => (
                      <Text key={idx} style={styles.bulletPoint}>• {takeaway}</Text>
                    ))}
                  </View>

                  <View style={styles.recapSection}>
                    <Text style={styles.recapSectionTitle}>Top Moments</Text>
                    {generatedRecap.topMoments.map((moment, idx) => (
                      <Text key={idx} style={styles.bulletPoint}>• {moment}</Text>
                    ))}
                  </View>

                  <View style={styles.emotionalToneContainer}>
                    <Text style={styles.emotionalToneLabel}>Emotional Tone:</Text>
                    <Text style={styles.emotionalTone}>{generatedRecap.emotionalTone}</Text>
                  </View>

                  {generatedRecap.peopleMet.length > 0 && (
                    <View style={styles.recapSection}>
                      <Text style={styles.recapSectionTitle}>People Met</Text>
                      <Text style={styles.peopleMet}>
                        {generatedRecap.peopleMet.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.regenerateButton}
                    onPress={handleGenerateRecap}
                  >
                    <Text style={styles.regenerateButtonText}>Regenerate</Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={handleSaveRecap}>
                    <Text style={styles.saveButtonText}>Save Recap</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  dateSelector: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500' as const,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  generateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  generateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#F97316',
    borderRadius: 50,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  existingRecapContainer: {
    marginBottom: 20,
  },
  existingRecapTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  recapContainer: {
    marginBottom: 20,
  },
  recapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  recapSummary: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 20,
  },
  recapSection: {
    marginBottom: 20,
  },
  recapSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 6,
  },
  emotionalToneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 20,
  },
  emotionalToneLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  emotionalTone: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#F97316',
    textTransform: 'capitalize' as const,
  },
  peopleMet: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  regenerateButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  regenerateButtonText: {
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
