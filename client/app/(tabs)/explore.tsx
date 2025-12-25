import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { api, Place, Trail } from '@/services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map marker interface for both places and trail stops
interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'place' | 'stop';
  order?: number;
  duration?: string;
  isSponsored?: boolean;
}

// Display stop with UI state
interface DisplayStop {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  order: number;
  duration?: string;
  note?: string;
  isWorkshop?: boolean;
  completed: boolean;
  current: boolean;
}

// Generate map HTML with markers and OSRM walking routes
const getMapHTML = (markers: MapMarker[], showRouteLine: boolean = true, routeColor: string = '#E45C12') => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
    .custom-marker {
      background: linear-gradient(234.6deg, #FCAA12 21.63%, #D94B2E 70.54%);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    .place-marker {
      background: #C41E3A;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .sponsored-marker {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .user-marker {
      background: #4285F4;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(66, 133, 244, 0.3), 0 2px 6px rgba(0,0,0,0.3);
    }
    .user-pulse {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(66, 133, 244, 0.2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,255,255,0.9);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 1000;
      display: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="loading" class="loading-overlay">Loading route...</div>
  <script>
    // Default center (Bhaktapur area)
    var defaultLat = 27.6722;
    var defaultLng = 85.4290;

    // Restore zoom from localStorage if available
    var initialZoom = 16;
    try {
      if (localStorage.zoom) initialZoom = parseInt(localStorage.zoom);
    } catch (e) {}

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([defaultLat, defaultLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Save zoom to localStorage on zoom events
    map.on('zoomend', function() {
      try { localStorage.zoom = map.getZoom(); } catch (e) {}
    });
    
    function createStopIcon(order) {
      return L.divIcon({
        className: 'custom-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">' + order + '</div>'
      });
    }
    
    var placeIcon = L.divIcon({
      className: 'place-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    var sponsoredIcon = L.divIcon({
      className: 'sponsored-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // User location marker (will be created dynamically)
    window.userMarker = null;
    window.routeLines = [];
    window.navigationLine = null;
    window.markers = [];
    
    var markersData = ${JSON.stringify(markers)};
    var showRoute = ${showRouteLine};
    var routeColor = '${routeColor}';
    
    // Check if coordinates are valid
    function isValidCoord(coord) {
      return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && 
             coord.lat !== 0 && coord.lng !== 0 && !isNaN(coord.lat) && !isNaN(coord.lng);
    }
    
    // OSRM walking route fetcher with better error handling
    async function getWalkingRoute(start, end) {
      // Validate coordinates
      if (!isValidCoord(start) || !isValidCoord(end)) {
        console.warn('Invalid coordinates for route:', start, end);
        return [[start.lat || 0, start.lng || 0], [end.lat || 0, end.lng || 0]];
      }
      
      try {
        var url = 'https://router.project-osrm.org/route/v1/foot/' + 
          start.lng + ',' + start.lat + ';' + end.lng + ',' + end.lat + 
          '?overview=full&geometries=geojson';
        var response = await fetch(url, { timeout: 5000 });
        var data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates.map(function(coord) {
            return [coord[1], coord[0]]; // Convert [lng, lat] to [lat, lng]
          });
        } else {
          console.warn('OSRM returned no route, falling back to straight line');
        }
      } catch (e) {
        console.error('OSRM error:', e);
      }
      // Fallback to straight line
      return [[start.lat, start.lng], [end.lat, end.lng]];
    }
    
    // Get complete walking route for all stops
    async function getCompleteRoute(stops, color) {
      document.getElementById('loading').style.display = 'block';
      
      // Clear existing route lines
      window.routeLines.forEach(function(line) { map.removeLayer(line); });
      window.routeLines = [];
      
      // Filter stops with valid coordinates
      var validStops = stops.filter(function(s) { return isValidCoord(s); });
      
      if (validStops.length < 2) {
        console.warn('Not enough valid stops for route');
        document.getElementById('loading').style.display = 'none';
        return;
      }
      
      for (var i = 0; i < validStops.length - 1; i++) {
        var start = { lat: validStops[i].lat, lng: validStops[i].lng };
        var end = { lat: validStops[i + 1].lat, lng: validStops[i + 1].lng };
        var routeCoords = await getWalkingRoute(start, end);
        var line = L.polyline(routeCoords, { 
          color: color, 
          weight: 5, 
          opacity: 0.85,
          dashArray: null,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
        window.routeLines.push(line);
      }
      
      document.getElementById('loading').style.display = 'none';
    }
    
    // Filter markers with valid coordinates
    var validMarkers = markersData.filter(function(m) { return isValidCoord(m); });
    
    // Add markers with numbered stops
    validMarkers.forEach(function(marker) {
      var icon;
      if (marker.type === 'stop') {
        icon = createStopIcon(marker.order || 1);
      } else if (marker.isSponsored) {
        icon = sponsoredIcon;
      } else {
        icon = placeIcon;
      }
      var m = L.marker([marker.lat, marker.lng], { icon: icon })
        .addTo(map)
        .bindPopup('<strong>' + marker.name + '</strong>' + (marker.duration ? '<br>Duration: ' + marker.duration : ''));
      window.markers.push(m);
    });
    
    // Draw walking route if enabled and multiple valid stops
    if (showRoute && validMarkers.length > 1) {
      var sortedMarkers = validMarkers
        .filter(function(m) { return m.type === 'stop'; })
        .sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
      if (sortedMarkers.length > 1) {
        getCompleteRoute(sortedMarkers, routeColor);
      }
    } else if (showRoute && validMarkers.length === 1) {
      // For a single place, center and add marker
      map.setView([validMarkers[0].lat, validMarkers[0].lng], 17);
      L.marker([validMarkers[0].lat, validMarkers[0].lng], { icon: placeIcon }).addTo(map);
    }

    // Fit bounds to show all valid markers (if more than one)
    if (validMarkers.length > 1) {
      var bounds = L.latLngBounds(validMarkers.map(function(m) { return [m.lat, m.lng]; }));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Function to update or create user location marker from React Native
    window.updateUserLocation = function(lat, lng, centerOnFirst) {
      if (window.userMarker) {
        window.userMarker.setLatLng([lat, lng]);
      } else {
        var userIcon = L.divIcon({
          className: 'user-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          html: '<div class="user-pulse"></div>'
        });
        window.userMarker = L.marker([lat, lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('You are here');
        if (centerOnFirst) {
          map.setView([lat, lng], map.getZoom());
        }
      }
    };
    
    // Function to center map on user
    window.centerMapOnUser = function(lat, lng) {
      map.setView([lat, lng], map.getZoom());
    };
    
    // Function to draw navigation route from user to first stop
    window.drawNavigationRoute = async function(userLat, userLng, destLat, destLng) {
      if (window.navigationLine) {
        map.removeLayer(window.navigationLine);
      }
      if (!isValidCoord({lat: userLat, lng: userLng}) || !isValidCoord({lat: destLat, lng: destLng})) {
        console.warn('Invalid navigation coordinates');
        return;
      }
      var routeCoords = await getWalkingRoute(
        { lat: userLat, lng: userLng },
        { lat: destLat, lng: destLng }
      );
      window.navigationLine = L.polyline(routeCoords, {
        color: '#4285F4',
        weight: 5,
        opacity: 0.85,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    };
    
    // Function to clear navigation route
    window.clearNavigationRoute = function() {
      if (window.navigationLine) {
        map.removeLayer(window.navigationLine);
        window.navigationLine = null;
      }
    };
    
    // Function to update markers dynamically
    window.updateMarkers = async function(newMarkers, showLine, lineColor) {
      // Clear existing markers (except user)
      window.markers.forEach(function(m) { map.removeLayer(m); });
      window.markers = [];
      window.routeLines.forEach(function(line) { map.removeLayer(line); });
      window.routeLines = [];
      
      // Filter to valid markers only
      var validNewMarkers = newMarkers.filter(function(m) { return isValidCoord(m); });
      
      // Add new markers (only valid ones)
      validNewMarkers.forEach(function(marker) {
        var icon;
        if (marker.type === 'stop') {
          icon = createStopIcon(marker.order || 1);
        } else if (marker.isSponsored) {
          icon = sponsoredIcon;
        } else {
          icon = placeIcon;
        }
        var m = L.marker([marker.lat, marker.lng], { icon: icon })
          .addTo(map)
          .bindPopup('<strong>' + marker.name + '</strong>' + (marker.duration ? '<br>Duration: ' + marker.duration : ''));
        window.markers.push(m);
      });
      
      // Draw walking route via OSRM
      if (showLine && validNewMarkers.length > 1) {
        var sortedMarkers = validNewMarkers
          .filter(function(m) { return m.type === 'stop'; })
          .sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        
        if (sortedMarkers.length > 1) {
          await getCompleteRoute(sortedMarkers, lineColor || '#E45C12');
        }
      }
      
      // Fit bounds
      if (validNewMarkers.length > 0) {
        var bounds = L.latLngBounds(validNewMarkers.map(function(m) { return [m.lat, m.lng]; }));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };
  </script>
</body>
</html>
`;

const FilterChip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <TouchableOpacity style={styles.filterChip} onPress={onPress} activeOpacity={0.7}>
    <LinearGradient
      colors={active ? ['#E45C12', '#DD5916'] : ['#FDF0E0', '#FDF0E0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.filterGradient}
    >
      <Text style={[styles.filterText, !active && styles.filterTextInactive]}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const RouteStopItem = ({
  stop,
  isFirst,
  isLast,
  onRecenter,
}: {
  stop: DisplayStop;
  isFirst: boolean;
  isLast: boolean;
  onRecenter: (lat: number, lng: number) => void;
}) => {
  const getStepIndicator = () => {
    if (stop.completed) {
      return (
        <View style={styles.completedIndicator}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      );
    } else if (stop.current) {
      return (
        <View style={styles.currentIndicator}>
          <Text style={styles.currentNumber}>{stop.id}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.futureIndicator}>
          <Text style={styles.futureNumber}>{stop.id}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.routeStop}>
      <View style={styles.timelineContainer}>
        {!isFirst && (
          <View
            style={[
              styles.lineTop,
              { backgroundColor: stop.completed || stop.current ? '#000' : '#E8E8E8' },
            ]}
          />
        )}
        {getStepIndicator()}
        {!isLast && (
          <View
            style={[
              styles.lineBottom,
              { backgroundColor: stop.completed ? '#000' : '#E8E8E8' },
            ]}
          />
        )}
      </View>
      <View style={styles.stopContent}>
        <Text style={[styles.stopName, !stop.completed && !stop.current && styles.futureStopName]}>
          {stop.name}
        </Text>
        {stop.description ? (
          <Text style={styles.stopDescription}>{stop.description}</Text>
        ) : null}
        </View>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onRecenter(stop.lat, stop.lng)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={16} color="#000" style={{ marginRight: 6 }} />
          </TouchableOpacity>
        </View>
      
    </View>
  );
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; id?: string; slug?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Data state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableTrails, setAvailableTrails] = useState<Trail[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [displayStops, setDisplayStops] = useState<DisplayStop[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('Roadmaps');
  const [mapKey, setMapKey] = useState(0);
  const [routeColor, setRouteColor] = useState('#E45C12');
  // New state for bottom sheet visibility
  const [showDetail, setShowDetail] = useState(true);

  // Select a trail and prepare display stops
  const selectTrail = useCallback((trail: Trail) => {
    setSelectedTrail(trail);
    setSelectedPlace(null);
    setCurrentStopIndex(0);
    setRouteColor(trail.color || '#E45C12');
    
    // Convert trail stops to display stops with place data
    const stops: DisplayStop[] = trail.stops.map((stop, index) => ({
      id: index + 1,
      name: stop.place?.name || stop.placeSlug,
      description: stop.note || stop.place?.description || '',
      lat: stop.place?.coordinates?.lat || 0,
      lng: stop.place?.coordinates?.lng || 0,
      order: stop.order,
      duration: stop.duration,
      note: stop.note,
      isWorkshop: stop.isWorkshop,
      completed: false,
      current: index === 0,
    }));
    
    // Create map markers for trail stops with duration info
    const markers: MapMarker[] = stops.map(stop => ({
      id: `stop-${stop.id}`,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      type: 'stop' as const,
      order: stop.order,
      duration: stop.duration,
    }));
    
    // Add sponsored stops as special markers
    if (trail.sponsoredStops && trail.sponsoredStops.length > 0) {
      trail.sponsoredStops.forEach((sponsoredStop, index) => {
        if (sponsoredStop.place) {
          markers.push({
            id: `sponsored-${index}`,
            name: sponsoredStop.place.name || sponsoredStop.placeSlug,
            lat: sponsoredStop.place.coordinates?.lat || 0,
            lng: sponsoredStop.place.coordinates?.lng || 0,
            type: 'place' as const,
            isSponsored: true,
          });
        }
      });
    }
    
    setDisplayStops(stops);
    setMapMarkers(markers);
    setMapKey(prev => prev + 1);
  }, []);

  // Select a place (single destination)
  const selectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    setSelectedTrail(null);
    setDisplayStops([]);
    setCurrentStopIndex(0);

    // Defensive: ensure coordinates are valid numbers
    const lat = Number(place.coordinates.lat);
    const lng = Number(place.coordinates.lng);
    const valid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    // Create single marker for place if valid, else fallback to Bhaktapur
    const markers: MapMarker[] = valid ? [{
      id: `place-${place._id}`,
      name: place.name,
      lat,
      lng,
      type: 'place',
    }] : [{
      id: 'default',
      name: 'Bhaktapur',
      lat: 27.6722,
      lng: 85.4290,
      type: 'place',
    }];

    setMapMarkers(markers);
    setMapKey(prev => prev + 1);
  }, []);

  // Start navigation from user to first stop
  const startNavigation = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to start navigation.');
      return;
    }
    
    if (displayStops.length === 0) {
      Alert.alert('No Stops', 'Please select a trail with stops to navigate.');
      return;
    }
    
    const firstStop = displayStops[0];
    setIsNavigating(true);
    
    // Draw navigation route from user to first stop
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.drawNavigationRoute) {
          window.drawNavigationRoute(${userLocation.lat}, ${userLocation.lng}, ${firstStop.lat}, ${firstStop.lng});
        }
        true;
      `);
    }
  }, [userLocation, displayStops]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.clearNavigationRoute) {
          window.clearNavigationRoute();
        }
        true;
      `);
    }
  }, []);

  // Start navigation to a place (single destination)
  const startPlaceNavigation = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to start navigation.');
      return;
    }
    
    if (!selectedPlace) {
      Alert.alert('No Place', 'Please select a place to navigate to.');
      return;
    }
    
    setIsNavigating(true);
    
    // Draw navigation route from user to place
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.drawNavigationRoute) {
          window.drawNavigationRoute(${userLocation.lat}, ${userLocation.lng}, ${selectedPlace.coordinates.lat}, ${selectedPlace.coordinates.lng});
        }
        true;
      `);
    }
  }, [userLocation, selectedPlace]);

  // Fetch data from API
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Seed data if needed
      await api.seedAll();
      
      // Fetch places and roadmaps in parallel
      const [placesRes, roadmapsRes] = await Promise.all([
        api.getPlaces(),
        api.getRoadmaps(),
      ]);
      
      setAllPlaces(placesRes.places);
      setAvailableTrails(roadmapsRes.roadmaps);
      
      // Set initial map markers to all places
      const placeMarkers: MapMarker[] = placesRes.places.map(place => ({
        id: `place-${place._id}`,
        name: place.name,
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
        type: 'place',
      }));
      setMapMarkers(placeMarkers);
      
      // Check if we have route params to select specific roadmap or place
      if (params.type && params.id) {
        if (params.type === 'trail' || params.type === 'roadmap') {
          const targetRoadmap = roadmapsRes.roadmaps.find(t => t._id === params.id || t.slug === params.slug);
          if (targetRoadmap) {
            selectTrail(targetRoadmap);
            return;
          }
        } else if (params.type === 'place') {
          const targetPlace = placesRes.places.find(p => p._id === params.id || p.slug === params.slug);
          if (targetPlace) {
            selectPlace(targetPlace);
            return;
          }
        }
      }
      
      // Select first roadmap by default if available
      if (roadmapsRes.roadmaps.length > 0) {
        selectTrail(roadmapsRes.roadmaps[0]);
      } else if (placesRes.places.length > 0) {
        selectPlace(placesRes.places[0]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectTrail, selectPlace, params.type, params.id, params.slug]);

  // Navigate between stops
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setDisplayStops(prevStops => {
      const newIndex = direction === 'next' 
        ? Math.min(currentStopIndex + 1, prevStops.length - 1)
        : Math.max(currentStopIndex - 1, 0);
      
      if (newIndex === currentStopIndex) return prevStops;
      
      setCurrentStopIndex(newIndex);
      
      return prevStops.map((stop, index) => ({
        ...stop,
        completed: index < newIndex,
        current: index === newIndex,
      }));
    });
  }, [currentStopIndex]);

  // Search places and trails
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchData();
      return;
    }
    
    try {
      setIsLoading(true);
      const [placesRes, roadmapsRes] = await Promise.all([
        api.searchPlaces(query),
        api.getRoadmaps(), // TODO: Add roadmap search API
      ]);
      
      setAllPlaces(placesRes.places);
      
      // Filter roadmaps locally for now
      const filteredRoadmaps = roadmapsRes.roadmaps.filter(roadmap =>
        roadmap.name.toLowerCase().includes(query.toLowerCase()) ||
        roadmap.description.toLowerCase().includes(query.toLowerCase())
      );
      setAvailableTrails(filteredRoadmaps);
      
      // Select first matching roadmap or place
      if (filteredRoadmaps.length > 0) {
        selectTrail(filteredRoadmaps[0]);
      } else if (placesRes.places.length > 0) {
        selectPlace(placesRes.places[0]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, selectTrail, selectPlace]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Request location permissions and start tracking
  useEffect(() => {
    startLocationTracking();
    
    return () => {
      // Cleanup: stop location tracking when component unmounts
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const startLocationTracking = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        Alert.alert(
          'Location Permission',
          'Please enable location services to track your position on the map.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsTracking(true);

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const initialCoords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setUserLocation(initialCoords);
      
      // Create user marker and center map on first location
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.updateUserLocation) {
            window.updateUserLocation(${initialCoords.lat}, ${initialCoords.lng}, true);
          }
          true;
        `);
      }

      // Start watching location for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every 1 seconds
          distanceInterval: 1, // Or when moved 10 meters
        },
        (newLocation) => {
          const newCoords = {
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          };
          setUserLocation(newCoords);
          
          // Update marker position in WebView (do NOT recenter)
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (window.updateUserLocation) {
                window.updateUserLocation(${newCoords.lat}, ${newCoords.lng});
              }
              true;
            `);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationError('Failed to get location');
    }
  };

  const centerOnUser = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.centerMapOnUser) {
          window.centerMapOnUser(${userLocation.lat}, ${userLocation.lng});
        }
        true;
      `);
    }
  };

  // Map container style: full screen if detail is hidden
  const mapContainerStyle = [
    styles.mapContainer,
    !showDetail && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100%',
      zIndex: 50,
      backgroundColor: '#fff',
    },
  ];

  // Improved recenter button style
  const recenterButtonStyle = {
    position: 'absolute',
    bottom: showDetail ? 60 : 30,
    right: 20,
    zIndex: 60,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Map Section */}
      <View style={mapContainerStyle}>
        <WebView
          key={mapKey}
          ref={webViewRef}
          source={{ html: getMapHTML(mapMarkers, !!selectedTrail, routeColor) }}
          style={[styles.map, !showDetail && { height: '100%' }]}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        {/* Improved Center on user button */}
        <TouchableOpacity style={recenterButtonStyle} onPress={centerOnUser} activeOpacity={0.8}>
          <Ionicons 
            name={isTracking ? "navigate" : "navigate-outline"} 
            size={26} 
            color={userLocation ? "#4285F4" : "#999"} 
          />
        </TouchableOpacity>

        {/* Hide search/filter UI if detail is hidden */}
        {showDetail && <>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={24} color="#000" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places & roadmaps..."
              placeholderTextColor="rgba(33, 37, 41, 0.46)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['#FDAA2E', '#EE5C19']}
                style={styles.filterButtonGradient}
              >
                <Ionicons name="options-outline" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Location error indicator */}
        {locationError && (
          <View style={styles.locationError}>
            <Ionicons name="warning" size={16} color="#E45C12" />
            <Text style={styles.locationErrorText}>{locationError}</Text>
          </View>
        )}
        </>}
      </View>

      {/* Show button to reappear detail page if hidden */}
      {!showDetail && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 30,
            alignItems: 'center',
            zIndex: 20,
          }}
          onPress={() => setShowDetail(true)}
        >
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <Ionicons name="chevron-up" size={22} color="#E45C12" />
            <Text style={{ color: '#E45C12', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Show Details</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Sheet with Trail/Place Info */}
      {showDetail && (
        <View style={styles.bottomSheet}>
          {/* Cross button to hide detail page */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 18,
              top: 18,
              zIndex: 20,
              backgroundColor: '#fff',
              borderRadius: 16,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={() => setShowDetail(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#E45C12" />
          </TouchableOpacity>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E45C12" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#E45C12" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.bottomSheetContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => fetchData(true)}
                  colors={['#E45C12']}
                  tintColor="#E45C12"
                />
              }
            >
              {/* ...existing code for Trail/Place/Empty views... */}
              {selectedTrail && (
                <>
                  <View style={styles.trailHeader}>
                    {selectedTrail.icon && (
                      <Text style={styles.trailIcon}>{selectedTrail.icon}</Text>
                    )}
                    <Text style={styles.routeTitle}>{selectedTrail.name}</Text>
                  </View>
                  {selectedTrail.description ? (
                    <Text style={styles.routeDescription}>{selectedTrail.description}</Text>
                  ) : null}
                  <View style={styles.routeMetaContainer}>
                    {selectedTrail.duration && (
                      <View style={styles.routeMeta}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.routeMetaText}>{selectedTrail.duration}</Text>
                      </View>
                    )}
                    {selectedTrail.distance && (
                      <View style={styles.routeMeta}>
                        <Ionicons name="walk-outline" size={14} color="#666" />
                        <Text style={styles.routeMetaText}>{selectedTrail.distance}</Text>
                      </View>
                    )}
                    {selectedTrail.difficulty && (
                      <View style={styles.routeMeta}>
                        <Ionicons name="fitness-outline" size={14} color="#666" />
                        <Text style={styles.routeMetaText}>{selectedTrail.difficulty}</Text>
                      </View>
                    )}
                    <View style={styles.routeMeta}>
                      <Ionicons name="location-outline" size={14} color="#666" />
                      <Text style={styles.routeMetaText}>{selectedTrail.stops.length} stops</Text>
                    </View>
                  </View>
                  <Text style={styles.stopsTitle}>Roadmap Stops:</Text>
                  {displayStops.map((stop, index) => (
                    <RouteStopItem
                      key={`stop-${index}`}
                      stop={stop}
                      isFirst={index === 0}
                      isLast={index === displayStops.length - 1}
                      onRecenter={(lat, lng) => {
                        if (webViewRef.current) {
                          webViewRef.current.injectJavaScript(`
                            if (window.map) { window.map.setView([${lat}, ${lng}], window.map.getZoom()); }
                            true;
                          `);
                        }
                      }}
                    />
                  ))}
                  {/* Navigation Button */}
                  <TouchableOpacity 
                    style={styles.startNavigationButton}
                    onPress={isNavigating ? stopNavigation : startNavigation}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isNavigating ? ['#666', '#444'] : ['#FDAA2E', '#EE5C19']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.navigationButtonGradient}
                    >
                      <Ionicons 
                        name={isNavigating ? "stop-circle" : "navigate"} 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={styles.navigationButtonText}>
                        {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              {selectedPlace && !selectedTrail && (
                <>
                  <Text style={styles.routeTitle}>{selectedPlace.name}</Text>
                  {selectedPlace.description ? (
                    <Text style={styles.routeDescription}>{selectedPlace.description}</Text>
                  ) : null}
                  <View style={styles.routeMetaContainer}>
                    {selectedPlace.category && (
                      <View style={styles.routeMeta}>
                        <Ionicons name="pricetag-outline" size={14} color="#666" />
                        <Text style={styles.routeMetaText}>{selectedPlace.category}</Text>
                      </View>
                    )}
                    {selectedPlace.openingHours && (
                      <View style={styles.routeMeta}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.routeMetaText}>{selectedPlace.openingHours}</Text>
                      </View>
                    )}
                    {selectedPlace.hasWorkshop && (
                      <View style={[styles.routeMeta, styles.workshopBadge]}>
                        <Ionicons name="construct-outline" size={14} color="#fff" />
                        <Text style={[styles.routeMetaText, { color: '#fff' }]}>Workshop</Text>
                      </View>
                    )}
                  </View>
                  {selectedPlace.address && (
                    <View style={styles.addressContainer}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.addressText}>{selectedPlace.address}</Text>
                    </View>
                  )}
                  {selectedPlace.entryFee && (
                    <View style={styles.entryFeeContainer}>
                      <Text style={styles.entryFeeTitle}>Entry Fee:</Text>
                      <Text style={styles.entryFeeText}>
                        Foreign: NPR {selectedPlace.entryFee.foreign} | SAARC: NPR {selectedPlace.entryFee.saarc}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.navigateButton}
                    onPress={isNavigating ? stopNavigation : startPlaceNavigation}
                  >
                    <Ionicons name={isNavigating ? "stop-circle" : "navigate"} size={20} color="#fff" />
                    <Text style={styles.navigateButtonText}>{isNavigating ? 'Stop Navigation' : 'Get Directions'}</Text>
                  </TouchableOpacity>
                </>
              )}
              {!selectedTrail && !selectedPlace && !isLoading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>Select a trail or place to explore</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.35,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    zIndex: 10,
  },
  centerButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 53,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '500',
    color: '#212529',
  },
  filterButton: {
    marginLeft: 8,
  },
  filterButtonGradient: {
    width: 49,
    height: 49,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  locationError: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  locationErrorText: {
    fontSize: 12,
    color: '#E45C12',
    flex: 1,
  },
  filterChip: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FDF0E0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E45C12',
    textAlign: 'center',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FDF0E0',
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 100,
  },
  routeTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#000',
    marginBottom: 16,
    letterSpacing: -1,
  },
  routeStop: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
  },
  lineTop: {
    width: 2,
    height: 14,
  },
  lineBottom: {
    width: 2,
    flex: 1,
    minHeight: 14,
  },
  completedIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  futureIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  futureNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  stopContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    lineHeight: 20,
  },
  futureStopName: {
    color: '#5E5E5E',
  },
  stopDescription: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  navButton: {
    backgroundColor: '#E8E8E8',
    height:30,
    width: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5E5E5E',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#5E5E5E',
    textAlign: 'center',
  },
  routeDescription: {
    fontSize: 14,
    color: '#5E5E5E',
    marginBottom: 16,
    lineHeight: 20,
  },
  routeMetaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeMetaText: {
    fontSize: 14,
    color: '#5E5E5E',
  },
  stopsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 16,
  },
  filterTextInactive: {
    fontSize: 14,
    color: '#5E5E5E',
  },
  trailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  trailIcon: {
    fontSize: 32,
  },
  workshopBadge: {
    backgroundColor: '#E45C12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  entryFeeContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FDF0E0',
    borderRadius: 12,
  },
  entryFeeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  entryFeeText: {
    fontSize: 13,
    color: '#666',
  },
  navigateButton: {
    flexDirection: 'row',
    height:2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 9,
    marginTop: 8,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  // Navigation button styles
  startNavigationButton: {
    marginTop: 24,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  navigationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
