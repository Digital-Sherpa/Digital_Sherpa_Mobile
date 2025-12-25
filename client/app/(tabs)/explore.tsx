import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import ViewShot, { captureRef } from "react-native-view-shot";
import { api, Place, Trail } from '@/services/api';
import { useAuth } from '../../context/AuthContext';

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
      background: #800080;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 8px rgba(128, 0, 128, 0.3), 0 2px 6px rgba(0,0,0,0.3);
    }
    .user-pulse {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(128, 0, 128, 0.2);
      animation: pulse 2s infinite;
    }
    /* Legend styles */
    .map-legend {
      position: absolute;
      top: 18px;
      right: 18px;
      background: rgba(255,255,255,0.98);
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.10);
      padding: 16px 22px 16px 18px;
      font-size: 14px;
      z-index: 1200;
      min-width: 140px;
      border: 1px solid #eee;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .legend-label { font-size: 14px; color: #1a1a1a; font-weight: 500; }
    .legend-dot {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      margin-right: 7px;
      vertical-align: middle;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .legend-dot-stop { background: linear-gradient(234.6deg, #FCAA12 21.63%, #D94B2E 70.54%); }
    .legend-dot-place { background: #C41E3A; }
    .legend-dot-sponsored { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); }
    .legend-dot-user { background: #4285F4; box-shadow: 0 0 0 4px rgba(66,133,244,0.18); }
    .legend-dot-user { position: relative; }
    .legend-dot-user::after { content: ''; position: absolute; left: 50%; top: 50%; width: 32px; height: 32px; background: rgba(66,133,244,0.13); border-radius: 50%; transform: translate(-50%,-50%); z-index: 0; }
    .legend-dot-user span { position: relative; z-index: 1; }
    .legend-dot-stop span { position: relative; z-index: 1; }
    .legend-dot-stop { display: flex; align-items: center; justify-content: center; }
    .legend-dot-stop span { color: #fff; font-size: 13px; font-weight: bold; }
    .legend-dot-nav { background: #4285F4; border: 2px solid #fff; box-shadow: 0 0 0 2px #4285F4; opacity: 0.7; }
    .legend-line {
      display: inline-block;
      width: 28px;
      height: 4px;
      border-radius: 2px;
      margin-right: 7px;
      vertical-align: middle;
    }
    .legend-line-route { background: #E45C12; }
    .legend-line-nav { background: #4285F4; opacity: 0.7; }
  </style>
  </style>
</head>
<body>
  <div id="map"></div>
  <!-- Map Legend -->
  <div class="map-legend">
    <div class="legend-row"><span class="legend-line legend-line-route"></span><span class="legend-label">Route</span></div>
    <div class="legend-row"><span class="legend-line legend-line-nav"></span><span class="legend-label">Navigation Path</span></div>
  </div>
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
      if (window.navigationDots) {
        window.navigationDots.forEach(function(dot) { map.removeLayer(dot); });
        window.navigationDots = [];
      } else {
        window.navigationDots = [];
      }
      if (!isValidCoord({lat: userLat, lng: userLng}) || !isValidCoord({lat: destLat, lng: destLng})) {
        console.warn('Invalid navigation coordinates');
        return;
      }
      var routeCoords = await getWalkingRoute(
        { lat: userLat, lng: userLng },
        { lat: destLat, lng: destLng }
      );
      // Draw blue dots along the navigation route
      for (var i = 0; i < routeCoords.length; i += Math.max(1, Math.floor(routeCoords.length / 20))) {
        var dot = L.circleMarker(routeCoords[i], {
          radius: 5,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.7,
          weight: 0
        }).addTo(map);
        window.navigationDots.push(dot);
      }
      window.navigationLine = L.polyline(routeCoords, {
        color: '#4285F4',
        weight: 4,
        opacity: 0.7,
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
      if (window.navigationDots) {
        window.navigationDots.forEach(function(dot) { map.removeLayer(dot); });
        window.navigationDots = [];
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
    
    // User Trail Logic
    window.userTrailLine = null;
    
    window.startUserTrail = function(lat, lng) {
      if (window.userTrailLine) map.removeLayer(window.userTrailLine);
      window.userTrailLine = L.polyline([[lat, lng]], {
        color: '#8A2BE2', // BlueViolet
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    };
    
    window.updateUserTrail = function(lat, lng) {
      if (window.userTrailLine) {
        window.userTrailLine.addLatLng([lat, lng]);
      } else {
        window.startUserTrail(lat, lng);
      }
    };
  </script>
</body>
</html>
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  expanded,
  onToggleExpand,
}: {
  stop: DisplayStop;
  isFirst: boolean;
  isLast: boolean;
  onRecenter: (lat: number, lng: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
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
        <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7}>
          <Text style={[styles.stopName, !stop.completed && !stop.current && styles.futureStopName]}>
            {stop.name}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#E45C12"
              style={{ marginLeft: 6 }}
            />
          </Text>
        </TouchableOpacity>
        {expanded && stop.description ? (
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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; id?: string; slug?: string; eventLat?: string; eventLng?: string; eventName?: string; eventAddress?: string; eventDescription?: string; eventCategory?: string; eventDate?: string }>();


  // Handle event params to show event as selected place
  // Prevent repeated reloads for the same event params
  const lastEventParams = useRef<{lat?: string, lng?: string, name?: string} | null>(null);
  useEffect(() => {
    if (params.eventLat && params.eventLng && params.eventName) {
      const isSame =
        lastEventParams.current &&
        lastEventParams.current.lat === params.eventLat &&
        lastEventParams.current.lng === params.eventLng &&
        lastEventParams.current.name === params.eventName;
      if (isSame) return;
      lastEventParams.current = {
        lat: params.eventLat,
        lng: params.eventLng,
        name: params.eventName,
      };
      // Create a pseudo-place for the event
      const eventPlace = {
        _id: params.id || 'event',
        name: params.eventName,
        slug: params.id || 'event',
        description: params.eventDescription || '',
        category: params.eventCategory || '',
        coordinates: {
          lat: Number(params.eventLat),
          lng: Number(params.eventLng),
        },
        imageUrl: '',
        gallery: [],
        videoUrl: '',
        address: params.eventAddress || '',
        openingHours: '',
        entryFee: undefined,
        tags: [],
        hasWorkshop: false,
        isSponsored: false,
        isEvent: true,
        eventDate: params.eventDate || '',
      };
      setSelectedPlace(eventPlace);
      setSelectedTrail(null);
      setDisplayStops([]);
      setCurrentStopIndex(0);
      setMapMarkers([
        {
          id: `event-${eventPlace._id}`,
          name: eventPlace.name,
          lat: eventPlace.coordinates.lat,
          lng: eventPlace.coordinates.lng,
          type: 'place' as const,
        },
      ]);
      setShowDetail(true);
      // Removed setMapKey - markers are now updated via JS injection
    }
  }, [params.eventLat, params.eventLng, params.eventName, params.id, params.eventDescription, params.eventAddress, params.eventCategory, params.eventDate]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  // Walk Tracking State
  const [walkTimer, setWalkTimer] = useState(0);
  const [walkLocations, setWalkLocations] = useState<{lat: number, lng: number}[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCaption, setSaveCaption] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSavingWalk, setIsSavingWalk] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer Logic
  useEffect(() => {
    if (isNavigating) {
      timerRef.current = setInterval(() => {
        setWalkTimer(t => t + 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isNavigating]);

  // Compute stats
  const walkStats = useMemo(() => {
    let distance = 0;
    if (walkLocations.length > 1) {
      for (let i = 1; i < walkLocations.length; i++) {
        // Simple Haversine approx or use library
        const R = 6371e3; // meters
        const φ1 = walkLocations[i-1].lat * Math.PI/180;
        const φ2 = walkLocations[i].lat * Math.PI/180;
        const Δφ = (walkLocations[i].lat-walkLocations[i-1].lat) * Math.PI/180;
        const Δλ = (walkLocations[i].lng-walkLocations[i-1].lng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance += R * c;
      }
    }
    return {
      distance, // meters
      steps: Math.floor(distance * 1.31), // approx steps
      calories: Math.floor(distance * 0.04), // approx calories
      avgSpeed: walkTimer > 0 ? (distance / walkTimer) * 3.6 : 0 // km/h
    };
  }, [walkLocations, walkTimer]);

  // Data state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableTrails, setAvailableTrails] = useState<Trail[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  // Extended Place type to include event properties
  const [selectedPlace, setSelectedPlace] = useState<(Place & { isEvent?: boolean; eventDate?: string }) | null>(null);
  const [displayStops, setDisplayStops] = useState<DisplayStop[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeFilter, setActiveFilter] = useState<string>('Roadmaps');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapKey, setMapKey] = useState(0);
  const [routeColor, setRouteColor] = useState('#E45C12');
  // New state for bottom sheet visibility
  const isDirectVisit = !(
    params.type || params.id || params.slug || params.eventLat || params.eventLng
  );
  const [showDetail, setShowDetail] = useState(!isDirectVisit);
  // Collapsible state for stops
  const [expandedStopIndex, setExpandedStopIndex] = useState(-1);

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
    // Removed setMapKey - markers are now updated via JS injection
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
    // Removed setMapKey - markers are now updated via JS injection
  }, []);

  // Start navigation from user to first stop and START WALKING
  const startNavigation = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to start navigation.');
      return;
    }
    
    // if (displayStops.length === 0 && !selectedPlace) { ... } // Optional check

    setIsNavigating(true);
    setWalkTimer(0);
    setWalkLocations([userLocation]); // Start with current location
    
    // Draw navigation route on map (suggested path)
    if (displayStops.length > 0 && webViewRef.current) {
       const firstStop = displayStops[0];
       webViewRef.current.injectJavaScript(`
          if (window.drawNavigationRoute) {
            window.drawNavigationRoute(${userLocation.lat}, ${userLocation.lng}, ${firstStop.lat}, ${firstStop.lng});
          }
          if (window.startUserTrail) {
            window.startUserTrail(${userLocation.lat}, ${userLocation.lng});
          }
          true;
       `);
    } else if (webViewRef.current) {
       // Just start trail if no suggested path
       webViewRef.current.injectJavaScript(`
          if (window.startUserTrail) {
            window.startUserTrail(${userLocation.lat}, ${userLocation.lng});
          }
          true;
       `);
    }
    
    // Stay on this screen
  }, [userLocation, displayStops, selectedTrail, selectedPlace]);

  // Stop navigation and save walk
  const stopNavigation = useCallback(async () => {
    setIsNavigating(false);
    
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Capture Snapshot of the map
    try {
      if (viewShotRef.current) {
         const uri = await viewShotRef.current?.capture();
         // Convert to base64 if needed, or upload. For simplicity we'll pass URI to modal
         // But API expects base64 or hosted URL. 
         // view-shot can capture to data-uri.
         const base64 = await captureRef(viewShotRef, {
            format: "jpg",
            quality: 0.8,
            result: "base64"
         });
         setCapturedImage(`data:image/jpeg;base64,${base64}`);
      }
    } catch (e) {
      console.error("Snapshot failed", e);
      Alert.alert("Error", "Could not capture map image.");
    }

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.clearNavigationRoute) {
          window.clearNavigationRoute();
        }
        true;
      `);
    }
    
    // Open Save Modal
    setShowSaveModal(true);
  }, []);



  // Start navigation to a place (single destination)

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
    setWalkTimer(0);
    setWalkLocations([userLocation]);
    
    // Draw navigation route from user to place AND start user trail
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.drawNavigationRoute) {
          window.drawNavigationRoute(${userLocation.lat}, ${userLocation.lng}, ${selectedPlace.coordinates.lat}, ${selectedPlace.coordinates.lng});
        }
        if (window.startUserTrail) {
            window.startUserTrail(${userLocation.lat}, ${userLocation.lng});
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

  const handleSaveWalk = async () => {
    if (!saveTitle.trim()) {
        Alert.alert("Title Required", "Please enter a title for your walk.");
        return;
    }

    if (!capturedImage) {
        Alert.alert("Snapshot Missing", "Map image is not ready. Please try again or re-record.");
        return;
    }
    
    setIsSavingWalk(true);
    try {
        if (!user) {
            Alert.alert("Error", "You must be logged in to save a walk.");
            setIsSavingWalk(false);
            return;
        }

        await api.createWalk({
            userId: user._id,
            mapImage: capturedImage,
            timeRecorded: walkTimer,
            title: saveTitle,
            caption: saveCaption,
            stats: walkStats
        });
        
        setShowSaveModal(false);
        setSaveTitle('');
        setSaveCaption('');
        setCapturedImage(null);
        if (webViewRef.current) {
             webViewRef.current.injectJavaScript(`
                if (window.clearNavigationRoute) window.clearNavigationRoute();
                if (window.userTrailLine) map.removeLayer(window.userTrailLine);
                window.userTrailLine = null;
                true;
             `);
        }
        setWalkLocations([]);
        Alert.alert("Success", "Walk saved to your collection!");
        
        // Refresh triggers
        fetchData(true);
    } catch (e: any) {
        const errorMessage = e?.message || "Failed to save walk.";
        Alert.alert("Error", errorMessage);
        console.error("Save walk error:", e);
    } finally {
        setIsSavingWalk(false);
    }
  };

  // Navigate between stops
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Initial fetch: only run if no event params
  useEffect(() => {
    if (!(params.eventLat && params.eventLng && params.eventName)) {
      fetchData();
    }
  }, [fetchData, params.eventLat, params.eventLng, params.eventName]);

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
          timeInterval: 1000, 
          distanceInterval: 1, 
        },
        (newLocation) => {
          const newCoords = {
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          };
          setUserLocation(newCoords);
          
          if (isNavigating) {
             setWalkLocations(prev => [...prev, newCoords]);
          }

          // Update marker position in WebView
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (window.updateUserLocation) {
                window.updateUserLocation(${newCoords.lat}, ${newCoords.lng});
              }
              ${isNavigating ? `if (window.updateUserTrail) { window.updateUserTrail(${newCoords.lat}, ${newCoords.lng}); }` : ''}
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

  // Map container style: full screen if detail is hidden (reserved for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mapContainerStyle: ViewStyle[] = [
    styles.mapContainer,
    ...(!showDetail ? [{
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100%' as unknown as number,
      zIndex: 50,
      backgroundColor: '#fff',
    }] : []),
  ];

  // Improved recenter button style with proper typing
  const recenterButtonStyle: ViewStyle = {
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

  // Inject user location as a marker for initial map load if available
  // Only include static markers - user location is handled via JS injection
  const stableMapMarkers = useMemo(() => {
    return mapMarkers;
  }, [mapMarkers]);

  // Memoize the map HTML to prevent unnecessary re-renders
  const mapHTML = useMemo(() => {
    return getMapHTML(stableMapMarkers, !!selectedTrail, routeColor);
  }, [stableMapMarkers, selectedTrail, routeColor]);

  // Update markers via JS injection when markers change (instead of re-rendering WebView)
  useEffect(() => {
    if (webViewRef.current && mapMarkers.length > 0) {
      const markersJSON = JSON.stringify(mapMarkers);
      webViewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${markersJSON}, ${!!selectedTrail}, '${routeColor}');
        }
        true;
      `);
    }
  }, [mapMarkers, selectedTrail, routeColor]);

  // Hide all details UI if direct visit
  if (isDirectVisit) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, flex: 1 }]}> 
        <View style={{ flex: 1 }}>
          <WebView
            key="explore-map-direct"
            ref={webViewRef}
            source={{ html: getMapHTML([], false, routeColor) }}
            style={[styles.map, { flex: 1 }]}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          {/* Center on user button */}
          <TouchableOpacity style={recenterButtonStyle} onPress={centerOnUser} activeOpacity={0.8}>
            <Ionicons 
              name={isTracking ? "navigate" : "navigate-outline"} 
              size={26} 
              color={userLocation ? "#4285F4" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, flex: 1 }]}> 
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Map Section (top 50%) */}
        <View style={{ flex: 1 }}>
          <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={{ flex: 1, paddingBottom: !showDetail ? 70 : 0 }}>
             {/* Stats Overlay during Walk */}
             {isNavigating && (
                <View style={[styles.walkOverlay, { top: insets.top + 10 }]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Time</Text>
                        <Text style={styles.statValue}>{new Date(walkTimer * 1000).toISOString().substr(11, 8)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Dist</Text>
                        <Text style={styles.statValue}>{(walkStats.distance / 1000).toFixed(2)} km</Text>
                    </View>
                </View>
             )}

            <WebView
              key="explore-map-main"
              ref={webViewRef}
              source={{ html: mapHTML }}
              style={[styles.map, { flex: 1 }]}
              scrollEnabled={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadEnd={() => {
                // ...
              }}
            />
          </ViewShot>
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
          {/* <View style={styles.searchContainer}>
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
          </View> */}
          
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
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 30,
              alignItems: 'center',
              zIndex: 999,
            }}
          >
            <TouchableOpacity
              style={{
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
              }}
              onPress={() => setShowDetail(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-up" size={22} color="#E45C12" />
              <Text style={{ color: '#E45C12', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Show Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Sheet with Trail/Place Info (bottom 50%) */}
        {showDetail && (
          <View style={[styles.bottomSheet, { flex: 1, maxHeight: '50%' }]}> 
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
                        expanded={expandedStopIndex === index}
                        onToggleExpand={() => setExpandedStopIndex(expandedStopIndex === index ? -1 : index)}
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
                    {selectedPlace.isEvent ? (
                      <>
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
                          {selectedPlace.eventDate && (
                            <View style={styles.routeMeta}>
                              <Ionicons name="calendar-outline" size={14} color="#666" />
                              <Text style={styles.routeMetaText}>{selectedPlace.eventDate}</Text>
                            </View>
                          )}
                        </View>
                        {selectedPlace.address && (
                          <View style={styles.addressContainer}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.addressText}>{selectedPlace.address}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    <TouchableOpacity 
                      style={styles.startNavigationButton}
                      onPress={isNavigating ? stopNavigation : startPlaceNavigation}
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

      {/* Save Walk Modal */}
      <Modal visible={showSaveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.saveModalContent}>
                <Text style={styles.saveModalTitle}>Save Your Walk</Text>
                {capturedImage && (
                    <Image source={{ uri: capturedImage }} style={styles.capturedPreview} resizeMode="cover" />
                )}
                
                <Text style={styles.saveStatText}>
                    Duration: {new Date(walkTimer * 1000).toISOString().substr(11, 8)} • Dist: {(walkStats.distance / 1000).toFixed(2)} km
                </Text>

                <TextInput 
                    placeholder="Title (e.g. Morning Walk)"
                    style={styles.saveInput}
                    value={saveTitle}
                    onChangeText={setSaveTitle}
                />
                <TextInput 
                    placeholder="Caption (Optional)"
                    style={[styles.saveInput, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    value={saveCaption}
                    onChangeText={setSaveCaption}
                />

                <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveWalk}
                    disabled={isSavingWalk}
                >
                    {isSavingWalk ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Journey</Text>}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowSaveModal(false)}
                >
                    <Text style={styles.cancelButtonText}>Discard</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    color: '#E45C12',
    fontWeight: '700',
  },
  saveModalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  saveModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  capturedPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  saveStatText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  saveInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  saveButton: {
    backgroundColor: '#E45C12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
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
