import { useEvents } from '@/contexts/EventContext';
import { Event } from '@/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Plus } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { events, isLoading } = useEvents();

  const formatDateRange = (start: number, end: number) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', options);
    }
    
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const upcomingEvents = events.filter(e => e.endDate >= Date.now()).sort((a, b) => a.startDate - b.startDate);
  const pastEvents = events.filter(e => e.endDate < Date.now()).sort((a, b) => b.endDate - a.endDate);

  const renderEventCard = (event: Event) => (
    <Pressable
      key={event.id}
      style={({ pressed }) => [
        styles.eventCard,
        Platform.OS === 'ios' && pressed && styles.eventCardPressed
      ]}
      onPress={() => router.push(`/event/${event.id}`)}
    >
      {event.coverPhotoUri ? (
        <Image
          source={{ uri: event.coverPhotoUri }}
          style={styles.eventImage}
          contentFit="cover"
        />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Calendar size={32} color="#F97316" />
        </View>
      )}
      
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={1}>
          {event.name}
        </Text>
        
        <View style={styles.eventMeta}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.eventLocation} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        
        <View style={styles.eventMeta}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.eventDate}>
            {formatDateRange(event.startDate, event.endDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Event Memories</Text>
            <Text style={styles.headerSubtitle}>Capture every moment</Text>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              Platform.OS === 'ios' && pressed && styles.addButtonPressed
            ]}
            onPress={() => router.push('/create-event')}
          >
            <Plus size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first event to start capturing memories
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push('/create-event')}
              >
                <Text style={styles.emptyButtonText}>Create Event</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {upcomingEvents.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming & Active</Text>
                  {upcomingEvents.map(renderEventCard)}
                </View>
              )}
              
              {pastEvents.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Past Events</Text>
                  {pastEvents.map(renderEventCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginTop: 24,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#F97316',
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  eventCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    padding: 16,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
  },
});
