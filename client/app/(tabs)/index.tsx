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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [suggestedRoutes, setSuggestedRoutes] = useState<SuggestedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<SuggestedRoute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Featured events state (now array for multiple events)
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [eventLoading, setEventLoading] = useState(true);

  // AI Search state
  const [searchMode, setSearchMode] = useState<'normal' | 'ai'>('normal');
  const [showSearchModeModal, setShowSearchModeModal] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<SuggestedRoute[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchTimeout, setAiSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  // AI Search handler with debounce
  const handleAiSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAiSearchResults([]);
      return;
    }
    
    try {
      setIsAiSearching(true);
      const response = await api.aiSearch(query);
      if (response.success && response.suggested) {
        setAiSearchResults(response.suggested);
      }
    } catch (error) {
      console.error('AI search failed:', error);
      setAiSearchResults([]);
    } finally {
      setIsAiSearching(false);
    }
  }, []);

  // Handle search query change with debounce for AI mode
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (searchMode === 'ai') {
      // Clear previous timeout
      if (aiSearchTimeout) {
        clearTimeout(aiSearchTimeout);
      }
      // Set new debounced search
      const timeout = setTimeout(() => {
        handleAiSearch(text);
      }, 500);
      setAiSearchTimeout(timeout);
    }
  }, [searchMode, aiSearchTimeout, handleAiSearch]);

  useEffect(() => {
    fetchSuggestedRoutes();
    fetchFeaturedEvents();
  }, [fetchSuggestedRoutes, fetchFeaturedEvents]);

  // Clear AI results when switching to normal mode
  useEffect(() => {
    if (searchMode === 'normal') {
      setAiSearchResults([]);
    } else if (searchMode === 'ai' && searchQuery.trim()) {
      handleAiSearch(searchQuery);
    }
  }, [searchMode]);

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

  // Filter roadmaps by category and search query (for normal mode)
  const roadmapRoutes = searchMode === 'ai' 
    ? aiSearchResults 
    : suggestedRoutes.filter(route => {
        if (route.type !== 'roadmap') return false;
        
        // Category filter
        const matchesCategory = selectedCategory === 'All' || 
          route.category?.toLowerCase() === selectedCategory.toLowerCase();
        
        // Search filter - search in title, duration, category, difficulty, description
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          route.name?.toLowerCase().includes(query) ||
          route.duration?.toLowerCase().includes(query) ||
          route.category?.toLowerCase().includes(query) ||
          route.difficulty?.toLowerCase().includes(query) ||
          route.description?.toLowerCase().includes(query);
        
        return matchesCategory && matchesSearch;
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

          {/* Search Mode Selection Modal */}
          <Modal
            visible={showSearchModeModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSearchModeModal(false)}
          >
            <Pressable 
              style={styles.searchModeModalOverlay} 
              onPress={() => setShowSearchModeModal(false)}
            >
              <View style={styles.searchModeModalContent}>
                <Text style={styles.searchModeModalTitle}>Search Mode</Text>
                
                <TouchableOpacity
                  style={[
                    styles.searchModeOption,
                    searchMode === 'ai' && styles.searchModeOptionActive
                  ]}
                  onPress={() => {
                    setSearchMode('ai');
                    setShowSearchModeModal(false);
                  }}
                >
                  <View style={styles.searchModeOptionIcon}>
                    <Ionicons name="sparkles" size={24} color={searchMode === 'ai' ? '#fff' : '#E45C12'} />
                  </View>
                  <View style={styles.searchModeOptionText}>
                    <Text style={[
                      styles.searchModeOptionTitle,
                      searchMode === 'ai' && styles.searchModeOptionTitleActive
                    ]}>AI Search</Text>
                    <Text style={styles.searchModeOptionDesc}>Natural language powered by Gemini</Text>
                  </View>
                  {searchMode === 'ai' && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.searchModeOption,
                    searchMode === 'normal' && styles.searchModeOptionActive
                  ]}
                  onPress={() => {
                    setSearchMode('normal');
                    setShowSearchModeModal(false);
                  }}
                >
                  <View style={styles.searchModeOptionIcon}>
                    <Ionicons name="search" size={24} color={searchMode === 'normal' ? '#fff' : '#E45C12'} />
                  </View>
                  <View style={styles.searchModeOptionText}>
                    <Text style={[
                      styles.searchModeOptionTitle,
                      searchMode === 'normal' && styles.searchModeOptionTitleActive
                    ]}>Normal Search</Text>
                    <Text style={styles.searchModeOptionDesc}>Filter by keywords and categories</Text>
                  </View>
                  {searchMode === 'normal' && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              {searchMode === 'ai' ? (
                <Ionicons name="sparkles" size={22} color="#E45C12" style={styles.searchIcon} />
              ) : (
                <Ionicons name="search-outline" size={22} color="#000" style={styles.searchIcon} />
              )}
              <TextInput
                placeholder={searchMode === 'ai' ? "Ask AI: e.g., 'easy heritage tours'" : "Search roadmaps..."}
                placeholderTextColor="rgba(33, 37, 41, 0.46)"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {isAiSearching && (
                <ActivityIndicator size="small" color="#E45C12" style={{ marginRight: 8 }} />
              )}
              <TouchableOpacity onPress={() => setShowSearchModeModal(true)}>
                <LinearGradient
                  colors={searchMode === 'ai' ? ['#8B5CF6', '#6366F1'] : ['#FDAA2E', '#EE5C19']}
                  style={styles.filterButton}
                >
                  {searchMode === 'ai' ? (
                    <Ionicons name="sparkles" size={18} color="#fff" />
                  ) : (
                    <Ionicons name="options" size={18} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {searchMode === 'ai' && (
              <Text style={styles.aiModeIndicator}>✨ AI Mode Active - Ask anything!</Text>
            )}
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
            

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Coupons</Text>
            
            {/* Horizontal Scrolling Coupons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Coupon 1 */}
              <TouchableOpacity 
                style={styles.couponCard}
                activeOpacity={0.9}
                onPress={() => console.log('Coupon 1 tapped')}
              >
                <LinearGradient
                  colors={['#FF7F5C', '#FF6B47']}
                  style={styles.couponStub}
                >
                  <View style={styles.couponStubBorder}>
                    <Text style={styles.couponStubText}>COUPON</Text>
                  </View>
                </LinearGradient>
                
                <View style={styles.couponMain}>
                  <View style={styles.couponHeader}>
                    <Text style={styles.couponAmount}>$50.00</Text>
                    <View style={styles.couponLogo}>
                      <View style={styles.couponLogoIcon} />
                      <Text style={styles.couponLogoText}>Sherpa</Text>
                    </View>
                  </View>
                  <View style={styles.couponDivider} />
                  <Text style={styles.couponDescription}>
                    Redeem at any Digital Sherpa partner location during your tour.
                  </Text>
                  <View style={styles.couponFooter}>
                    <View style={styles.couponValidity}>
                      <Text style={styles.couponValidityText}>Valid through Jan 15, 2025</Text>
                    </View>
                    <View style={styles.couponCodeSection}>
                      <Text style={styles.couponCodeLabel}>Coupon Code</Text>
                      <Text style={styles.couponCode}>SHERPA50</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.couponRightEdge} />
              </TouchableOpacity>

              {/* Coupon 2 */}
              <TouchableOpacity 
                style={styles.couponCard}
                activeOpacity={0.9}
                onPress={() => console.log('Coupon 2 tapped')}
              >
                <LinearGradient
                  colors={['#FF7F5C', '#FF6B47']}
                  style={styles.couponStub}
                >
                  <View style={styles.couponStubBorder}>
                    <Text style={styles.couponStubText}>COUPON</Text>
                  </View>
                </LinearGradient>
                
                <View style={styles.couponMain}>
                  <View style={styles.couponHeader}>
                    <Text style={styles.couponAmount}>20% OFF</Text>
                    <View style={styles.couponLogo}>
                      <View style={styles.couponLogoIcon} />
                      <Text style={styles.couponLogoText}>Café</Text>
                    </View>
                  </View>
                  <View style={styles.couponDivider} />
                  <Text style={styles.couponDescription}>
                    Get 20% off at Heritage Café, Patan Durbar Square.
                  </Text>
                  <View style={styles.couponFooter}>
                    <View style={styles.couponValidity}>
                      <Text style={styles.couponValidityText}>Valid through Feb 28, 2025</Text>
                    </View>
                    <View style={styles.couponCodeSection}>
                      <Text style={styles.couponCodeLabel}>Coupon Code</Text>
                      <Text style={styles.couponCode}>CAFE20</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.couponRightEdge} />
              </TouchableOpacity>

              {/* Coupon 3 */}
              <TouchableOpacity 
                style={styles.couponCard}
                activeOpacity={0.9}
                onPress={() => console.log('Coupon 3 tapped')}
              >
                <LinearGradient
                  colors={['#FF7F5C', '#FF6B47']}
                  style={styles.couponStub}
                >
                  <View style={styles.couponStubBorder}>
                    <Text style={styles.couponStubText}>COUPON</Text>
                  </View>
                </LinearGradient>
                
                <View style={styles.couponMain}>
                  <View style={styles.couponHeader}>
                    <Text style={styles.couponAmount}>FREE</Text>
                    <View style={styles.couponLogo}>
                      <View style={styles.couponLogoIcon} />
                      <Text style={styles.couponLogoText}>Workshop</Text>
                    </View>
                  </View>
                  <View style={styles.couponDivider} />
                  <Text style={styles.couponDescription}>
                    Free pottery workshop at Bhaktapur Pottery Square.
                  </Text>
                  <View style={styles.couponFooter}>
                    <View style={styles.couponValidity}>
                      <Text style={styles.couponValidityText}>Valid through Mar 15, 2025</Text>
                    </View>
                    <View style={styles.couponCodeSection}>
                      <Text style={styles.couponCodeLabel}>Coupon Code</Text>
                      <Text style={styles.couponCode}>POTTERY1</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.couponRightEdge} />
              </TouchableOpacity>
            </ScrollView>
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
  // Coupon Ticket Styles
  couponCard: {
    marginTop: 24,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    height: 180,
    width: 300,
    marginRight: 12,
    backgroundColor: '#FFF8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  couponStub: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  couponStubBorder: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  couponStubText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    transform: [{ rotate: '-90deg' }],
    width: 80,
    textAlign: 'center',
  },
  couponMain: {
    flex: 1,
    padding: 16,
    paddingRight: 24,
    justifyContent: 'space-between',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  couponAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FF6B47',
    lineHeight: 44,
  },
  couponLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponLogoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B47',
  },
  couponLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B47',
  },
  couponDivider: {
    borderTopWidth: 2,
    borderStyle: 'dotted',
    borderColor: '#ddd',
    marginVertical: 8,
  },
  couponDescription: {
    fontSize: 10,
    color: '#999',
    lineHeight: 14,
    textAlign: 'center',
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponValidity: {
    backgroundColor: '#FF6B47',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  couponValidityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  couponCodeSection: {
    alignItems: 'flex-end',
  },
  couponCodeLabel: {
    fontSize: 8,
    color: '#999',
    textTransform: 'uppercase',
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B47',
    letterSpacing: 2,
  },
  couponRightEdge: {
    width: 16,
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  // AI Search Mode Modal Styles
  searchModeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  searchModeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  searchModeOptionActive: {
    backgroundColor: '#E45C12',
  },
  searchModeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchModeOptionText: {
    flex: 1,
  },
  searchModeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchModeOptionTitleActive: {
    color: '#fff',
  },
  searchModeOptionDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  aiModeIndicator: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
