import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const categories = ['Casual Walk', 'Heritage Sites', 'Traditional Craft'];
  
  const suggestedRoutes = [
    { id: 1, title: 'Temple Visit', duration: 'for 30 minutes', image: require('@/assets/images/templevisit.png') },
    { id: 2, title: '10,000 steps challenge', duration: 'for 30 minutes', image: require('@/assets/images/10000 steps.png') },
  ];

  const featuredEventImage = require('@/assets/images/biska jatra.png');

  return (
    <View style={styles.container}>
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
              <Text style={styles.greeting}>Namaste, John</Text>
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
                <TouchableOpacity key={index} style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Event */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Event:</Text>
            <View style={styles.featuredCard}>
              <Image
                source={featuredEventImage}
                style={styles.featuredImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.featuredGradient}
              >
                <Text style={styles.featuredTitle}>Biska Jatra Day 1</Text>
                <Text style={styles.featuredDescription}>
                  Bhaktapur&apos;s vibrant nine-day festival celebrating the Nepali New Year with iconic chariot processions.
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Suggested Routes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Routes:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
              {suggestedRoutes.map((route) => (
                <View key={route.id} style={styles.routeCard}>
                  <Image
                    source={route.image}
                    style={styles.routeImage}
                    contentFit="cover"
                  />
                  <View style={styles.routeOverlay}>
                    <Text style={styles.popularTag}>POPULAR</Text>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeTitle}>{route.title}</Text>
                      <Text style={styles.routeDuration}>{route.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.routeButton}>
                    <Ionicons name="paper-plane" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 120 }} />
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
  routesScroll: {
    flexDirection: 'row',
  },
  routeCard: {
    width: 184,
    height: 256,
    borderRadius: 16,
    borderBottomLeftRadius: 88,
    overflow: 'hidden',
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
  routeOverlay: {
    flex: 1,
    padding: 16,
  },
  popularTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    opacity: 0.5,
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
  },
  routeDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 2,
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 56,
    height: 56,
    backgroundColor: '#25E88A',
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
