import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { api, SuggestedRoute, Event } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const categories = ['All', 'Wood Carving', 'Pottery', 'Heritage', 'Cultural'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [suggestedRoutes, setSuggestedRoutes] = useState<SuggestedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<SuggestedRoute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Featured events state (now array for multiple events)
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [eventLoading, setEventLoading] = useState(true);

  // Fallback images for routes without cover images
  const fallbackImages = [
    require('@/assets/images/templevisit.png'),
    require('@/assets/images/10000 steps.png'),
  ];

  const fetchSuggestedRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.seedAll(); // Seed data if needed
      const response = await api.getSuggestedRoutes();
      setSuggestedRoutes(response.suggested);
    } catch (error) {
      console.error('Failed to fetch suggested routes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch featured events from backend
  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setEventLoading(true);
      const response = await api.getFeaturedEvents();
      if (response.success && response.events.length > 0) {
        setFeaturedEvents(response.events);
      }
    } catch (error) {
      console.error('Failed to fetch featured events:', error);
    } finally {
      setEventLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestedRoutes();
    fetchFeaturedEvents();
  }, [fetchSuggestedRoutes, fetchFeaturedEvents]);

  // Navigate to explore page with route details
  const handleNavigateToExplore = (route: SuggestedRoute) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { 
        type: route.type,
        id: route._id,
        slug: route.slug,
      },
    });
  };

  // Show detail modal when image is clicked
  const handleShowDetails = (route: SuggestedRoute) => {
    setSelectedRoute(route);
    setShowDetailModal(true);
  };

  // Filter only roadmaps and by selected category
  const roadmapRoutes = suggestedRoutes.filter(route => {
    if (route.type !== 'roadmap') return false;
    if (selectedCategory === 'All') return true;
    return route.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Close the detail modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRoute(null);
  };

  return (
    <View style={styles.container}>
      {/* Route Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedRoute && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <Image
                  source={
                    selectedRoute.coverImage 
                      ? { uri: selectedRoute.coverImage } 
                      : fallbackImages[0]
                  }
                  style={styles.modalImage}
                  contentFit="cover"
                />
                
                <View style={styles.modalBody}>
                  <View style={styles.modalTags}>
                    <Text style={styles.modalTag}>🗺️ ROADMAP</Text>
                    {selectedRoute.difficulty && (
                      <Text style={[styles.modalTag, styles.modalDifficultyTag]}>
                        {selectedRoute.difficulty.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={styles.modalTitle}>{selectedRoute.name}</Text>
                  
                  {selectedRoute.description && (
                    <Text style={styles.modalDescription}>{selectedRoute.description}</Text>
                  )}
                  
                  <View style={styles.modalMeta}>
                    {selectedRoute.duration && (
                      <View style={styles.modalMetaItem}>
                        <Ionicons name="time-outline" size={18} color="#666" />
                        <Text style={styles.modalMetaText}>{selectedRoute.duration}</Text>
                      </View>
                    )}
                    {selectedRoute.distance && (
                      <View style={styles.modalMetaItem}>
                        <Ionicons name="walk-outline" size={18} color="#666" />
                        <Text style={styles.modalMetaText}>{selectedRoute.distance}</Text>
                      </View>
                    )}
                    {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                      <View style={styles.modalMetaItem}>
                        <Ionicons name="location-outline" size={18} color="#666" />
                        <Text style={styles.modalMetaText}>{selectedRoute.stops.length} stops</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Stops List */}
                  {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                    <View style={styles.modalStops}>
                      <Text style={styles.modalStopsTitle}>Roadmap Stops:</Text>
                      {selectedRoute.stops.map((stop, index) => (
                        <View key={index} style={styles.modalStopItem}>
                          <View style={styles.modalStopNumber}>
                            <Text style={styles.modalStopNumberText}>{stop.order}</Text>
                          </View>
                          <View style={styles.modalStopInfo}>
                            <Text style={styles.modalStopName}>
                              {stop.place?.name || stop.placeSlug}
                            </Text>
                            {stop.duration && (
                              <Text style={styles.modalStopDuration}>{stop.duration}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.modalNavigateButton}
                    onPress={() => {
                      handleCloseModal();
                      handleNavigateToExplore(selectedRoute);
                    }}
                  >
                    <LinearGradient
                      colors={['#25E88A', '#1BC47A']}
                      style={styles.modalNavigateGradient}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.modalNavigateText}>Start Navigation</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      {/* Background SVG */}
      <Image
        source={require('@/assets/images/Hello World.svg')}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        contentFit="cover"
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.profileCircle} />
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Namaste, {user?.name || 'Guest'}</Text>
              <Text style={styles.subtitle}>Welcome to Digital Sherpa</Text>
            </View>
            <View style={styles.headerIcons}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={20} color="#000" />
                <View style={styles.notificationBadge} />
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name="options-outline" size={20} color="#000" />
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={22} color="#000" style={styles.searchIcon} />
              <TextInput
                placeholder="Search"
                placeholderTextColor="rgba(33, 37, 41, 0.46)"
                style={styles.searchInput}
              />
              <LinearGradient
                colors={['#FDAA2E', '#EE5C19']}
                style={styles.filterButton}
              >
                <Ionicons name="options" size={18} color="#fff" />
              </LinearGradient>
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your next experience</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryPill, selectedCategory === category && { backgroundColor: '#E45C12' }]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryText, selectedCategory === category && { color: '#fff' }]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Events - horizontal scroll */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Events:</Text>
            {eventLoading ? (
              <View style={styles.featuredLoading}>
                <ActivityIndicator size="small" color="#E45C12" />
              </View>
            ) : featuredEvents.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredEvents.map((event) => (
                  <TouchableOpacity
                    key={event._id}
                    style={[styles.featuredCard, { marginRight: 12, width: 280 }]}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (event.locations && event.locations.length > 0) {
                        const loc = event.locations[0];
                        router.push({
                          pathname: '/(tabs)/explore',
                          params: {
                            eventId: event._id,
                            eventName: event.name,
                            eventLat: loc.coordinates?.lat,
                            eventLng: loc.coordinates?.lng,
                            eventDescription: event.description || '',
                            eventCategory: event.category || '',
                            eventDate: event.startDate || '',
                            eventAddress: loc.address || '',
                          },
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={styles.featuredImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', event.color || 'rgba(0,0,0,0.8)']}
                      style={styles.featuredGradient}
                    >
                      <View style={styles.featuredHeader}>
                        <Text style={styles.featuredIcon}>{event.icon}</Text>
                        <Text style={styles.featuredCategory}>{event.category?.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={1}>{event.name}</Text>
                      {event.description ? (
                        <Text style={styles.featuredDescription} numberOfLines={2}>{event.description}</Text>
                      ) : null}
                      {event.locations && event.locations.length > 0 && (
                        <Text style={styles.featuredLocation}>
                          📍 {event.locations[0].name}
                        </Text>
                      )}
                      {event.startDate && (
                        <Text style={styles.featuredDate}>
                          📅 {new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.featuredCard, styles.featuredLoading]}>
                <Text style={styles.noEventText}>No featured events</Text>
              </View>
            )}
          </View>

          {/* Suggested Roadmaps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Roadmaps:</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#E45C12" />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
                {roadmapRoutes.map((route, index) => (
                  <View key={route._id} style={styles.routeCard}>
                    {/* Image area - clickable for details */}
                    <TouchableOpacity 
                      style={styles.routeImageTouchable}
                      onPress={() => handleShowDetails(route)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={
                          route.coverImage 
                            ? { uri: route.coverImage } 
                            : fallbackImages[index % fallbackImages.length]
                        }
                        style={styles.routeImage}
                        contentFit="cover"
                      />
                      <View style={styles.routeOverlay}>
                        <View style={styles.routeTagsRow}>
                          <Text style={styles.popularTag}>ROADMAP</Text>
                          {route.difficulty && (
                            <Text style={styles.difficultyTag}>{route.difficulty.toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={styles.routeInfo}>
                          <Text style={styles.routeTitle}>{route.name}</Text>
                          <Text style={styles.routeDuration}>
                            {route.duration ? route.duration : route.category}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.routeButton}
                      onPress={() => handleNavigateToExplore(route)}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EDEE',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 23,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    marginBottom: 20,
  },
  profileCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9D9D9',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#000',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(33, 37, 41, 0.81)',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#B3261E',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 53,
    paddingLeft: 16,
    shadowColor: '#0C0C0D',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  filterButton: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    backgroundColor: '#FDF0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 19,
    marginRight: 10,
    shadowColor: '#0C0C0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E05A15',
  },
  featuredCard: {
    height: 139,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 13,
  },
  featuredTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  featuredDescription: {
    fontSize: 10,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 4,
  },
  featuredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  featuredIcon: {
    fontSize: 16,
  },
  featuredCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  featuredLocation: {
    fontSize: 10,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 2,
  },
  featuredDate: {
    fontSize: 10,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 2,
  },
  noEventText: {
    fontSize: 14,
    color: '#666',
  },
  routesScroll: {
    flexDirection: 'row',
  },
  routeCard: {
    width: 172,
    height: 256,
    overflow: 'hidden',
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 25,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    
  },
  routeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    
  },
  routeImageTouchable: {
    flex: 1,
  },
  routeOverlay: {
    flex: 1,
    padding: 16,
  },
  routeTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  popularTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  difficultyTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#E45C12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  routeDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1000,
    width: 56,
    height: 56,
    backgroundColor: '#25E88A',
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 56,
    borderTopLeftRadius: 56,
    borderBottomRightRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },


  /* Rectangle 2 */

// position: absolute;
// width: 56px;
// height: 56px;
// left: 0px;
// top: 200px;

// background: #25E88A;
// border-radius: 56px 16px 56px 56px;



  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalBody: {
    padding: 20,
  },
  modalTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: 'hidden',
  },
  modalDifficultyTag: {
    backgroundColor: '#FDF0E0',
    color: '#E45C12',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMetaText: {
    fontSize: 14,
    color: '#666',
  },
  modalStops: {
    marginBottom: 20,
  },
  modalStopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modalStopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalStopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E45C12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalStopNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalStopInfo: {
    flex: 1,
  },
  modalStopName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalStopDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalNavigateButton: {
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalNavigateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  modalNavigateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
