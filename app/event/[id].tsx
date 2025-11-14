import { useEvents, useEventById } from '@/contexts/EventContext';
import { Moment, MomentTag } from '@/types';
import React from 'react';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, FileText, Image as ImageIcon, MapPin, Mic, Plus, Sparkles, Search, X, SlidersHorizontal, Grid3x3, Edit2, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert, TextInput, Modal } from 'react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = useEventById(id!);
  const { getEventMoments, getEventRecaps, getEventReport, deleteEvent, deleteMoment } = useEvents();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<MomentTag[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{ start?: Date; end?: Date }>({});

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const allMoments = getEventMoments(event.id);
  
  const moments = React.useMemo(() => {
    let filtered = allMoments;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.content.toLowerCase().includes(query)
      );
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(m => 
        m.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(m => {
        const momentDate = new Date(m.timestamp);
        const startOk = !dateRange.start || momentDate >= dateRange.start;
        const endOk = !dateRange.end || momentDate <= dateRange.end;
        return startOk && endOk;
      });
    }
    
    return filtered;
  }, [allMoments, searchQuery, selectedTags, dateRange]);
  const recaps = getEventRecaps(event.id);
  const report = getEventReport(event.id);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleTagFilter = (tag: MomentTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setDateRange({});
    setShowFilters(false);
  };

  const getMomentIcon = (type: string) => {
    switch (type) {
      case 'text':
        return FileText;
      case 'photo':
        return ImageIcon;
      case 'voice':
        return Mic;
      default:
        return FileText;
    }
  };

  const getTagColor = (tag: MomentTag) => {
    switch (tag) {
      case 'Networking':
        return '#3B82F6';
      case 'Learning':
        return '#8B5CF6';
      case 'Inspiration':
        return '#F59E0B';
      case 'Fun':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This will also delete all moments, recaps, and reports.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteMoment = (moment: Moment) => {
    Alert.alert(
      'Delete Moment',
      'Are you sure you want to delete this moment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMoment(moment.id);
          },
        },
      ]
    );
  };

  const handleEditMoment = (moment: Moment) => {
    router.push(`/add-moment?eventId=${event.id}&momentId=${moment.id}`);
  };

  const renderMoment = (moment: Moment) => {
    const Icon = getMomentIcon(moment.type);

    return (
      <View key={moment.id} style={styles.momentCard}>
        <View style={styles.momentHeader}>
          <View style={styles.momentIconContainer}>
            <Icon size={16} color="#F97316" />
          </View>
          <View style={styles.momentHeaderText}>
            <Text style={styles.momentTime}>{formatDate(moment.timestamp)}</Text>
          </View>
          
          <View style={styles.momentActions}>
            <Pressable
              style={styles.momentActionButton}
              onPress={() => handleEditMoment(moment)}
            >
              <Edit2 size={16} color="#6B7280" />
            </Pressable>
            <Pressable
              style={styles.momentActionButton}
              onPress={() => handleDeleteMoment(moment)}
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {moment.photoUri && (
          <Image
            source={{ uri: moment.photoUri }}
            style={styles.momentImage}
            contentFit="cover"
          />
        )}

        <Text style={styles.momentContent}>{moment.content}</Text>

        {moment.tags.length > 0 && (
          <View style={styles.momentTags}>
            {moment.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: getTagColor(tag) + '20' }]}
              >
                <Text style={[styles.tagText, { color: getTagColor(tag) }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: event.name,
          headerRight: () => (
            <Pressable onPress={handleDeleteEvent}>
              <Text style={styles.deleteButton}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {event.coverPhotoUri && (
            <Image
              source={{ uri: event.coverPhotoUri }}
              style={styles.coverImage}
              contentFit="cover"
            />
          )}

          <View style={styles.content}>
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search moments..."
                  placeholderTextColor="#9CA3AF"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={20} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
              
              <Pressable 
                style={[styles.filterButton, (selectedTags.length > 0 || dateRange.start || dateRange.end) && styles.filterButtonActive]}
                onPress={() => setShowFilters(true)}
              >
                <SlidersHorizontal size={20} color={(selectedTags.length > 0 || dateRange.start || dateRange.end) ? "#F97316" : "#6B7280"} />
              </Pressable>
            </View>

            <View style={styles.eventHeader}>
              <Text style={styles.eventName}>{event.name}</Text>
              
              <View style={styles.eventMeta}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.eventMetaText}>{event.location}</Text>
              </View>

              <View style={styles.eventMeta}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.eventMetaText}>
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </Text>
              </View>

              {event.purpose && (
                <View style={styles.purposeCard}>
                  <Text style={styles.purposeLabel}>Purpose</Text>
                  <Text style={styles.purposeText}>{event.purpose}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <View style={styles.actionsGrid}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/add-moment?eventId=${event.id}`)}
                >
                  <View style={styles.actionIconContainer}>
                    <Plus size={20} color="#F97316" />
                  </View>
                  <Text style={styles.actionText}>Add Moment</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/daily-recap/${event.id}`)}
                >
                  <View style={styles.actionIconContainer}>
                    <Calendar size={20} color="#F97316" />
                  </View>
                  <Text style={styles.actionText}>Daily Recap</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/final-report/${event.id}`)}
                >
                  <View style={styles.actionIconContainer}>
                    <Sparkles size={20} color="#F97316" />
                  </View>
                  <Text style={styles.actionText}>Memory Report</Text>
                </Pressable>
              </View>
              
              <Pressable
                style={styles.galleryButton}
                onPress={() => router.push(`/gallery/${event.id}`)}
              >
                <Grid3x3 size={20} color="#F97316" />
                <Text style={styles.galleryButtonText}>Photo Gallery</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Moments</Text>
                <Text style={styles.sectionCount}>{moments.length}</Text>
              </View>

              {moments.length === 0 ? (
                <View style={styles.emptyState}>
                  <FileText size={32} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No moments yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start capturing your experience
                  </Text>
                </View>
              ) : (
                moments.map(renderMoment)
              )}
            </View>

            {recaps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Recaps</Text>
                <Text style={styles.sectionSubtext}>
                  {recaps.length} recap{recaps.length !== 1 ? 's' : ''} generated
                </Text>
              </View>
            )}

            {report && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Final Report</Text>
                <Text style={styles.sectionSubtext}>Memory report is ready!</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Moments</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Tags</Text>
                <View style={styles.filterTags}>
                  {(['Networking', 'Learning', 'Inspiration', 'Fun'] as MomentTag[]).map(tag => (
                    <Pressable
                      key={tag}
                      style={[
                        styles.filterTag,
                        selectedTags.includes(tag) && styles.filterTagActive,
                        { borderColor: getTagColor(tag) }
                      ]}
                      onPress={() => toggleTagFilter(tag)}
                    >
                      <Text
                        style={[
                          styles.filterTagText,
                          selectedTags.includes(tag) && { color: getTagColor(tag) },
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <Text style={styles.filterHint}>Filter moments by date</Text>
                <View style={styles.dateRangeInputs}>
                  <View style={styles.dateRangeInput}>
                    <Text style={styles.dateRangeLabel}>From</Text>
                    <TextInput
                      style={styles.dateRangeTextInput}
                      value={dateRange.start?.toLocaleDateString() || ''}
                      placeholder="Start date"
                      editable={false}
                    />
                  </View>
                  <View style={styles.dateRangeInput}>
                    <Text style={styles.dateRangeLabel}>To</Text>
                    <TextInput
                      style={styles.dateRangeTextInput}
                      value={dateRange.end?.toLocaleDateString() || ''}
                      placeholder="End date"
                      editable={false}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  deleteButton: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  eventHeader: {
    marginBottom: 24,
  },
  eventName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  purposeCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  purposeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  purposeText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1F2937',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  momentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  momentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  momentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  momentImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  momentContent: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  momentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  searchSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSiz
