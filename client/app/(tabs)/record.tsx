
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Background } from '@/components/background';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h} : ${m} : ${s}`;
}

export default function Record() {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [locations, setLocations] = useState<Location.LocationObject[]>([]);
  // const [errorMsg, setErrorMsg] = useState('');
  const watchId = useRef<number | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

  // Location tracking logic
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Permission denied
        return;
      }
    })();
  }, []);

  useEffect(() => {
    if (isRunning) {
      (async () => {
        watchId.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            setLocations((prev) => [...prev, loc]);
          }
        ) as unknown as number;
      })();
    } else if (watchId.current !== null) {
      Location.stopLocationUpdatesAsync(watchId.current as any);
      watchId.current = null;
    }
    return () => {
      if (watchId.current !== null) {
        Location.stopLocationUpdatesAsync(watchId.current as any);
        watchId.current = null;
      }
    };
  }, [isRunning]);

  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const getDistanceFromLatLonInKm = React.useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate distance and speed
  useEffect(() => {
    if (locations.length < 2) {
      setDistance(0);
      setAvgSpeed(0);
      return;
    }
    let d = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1].coords;
      const curr = locations[i].coords;
      d += getDistanceFromLatLonInKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    setDistance(d);
    setAvgSpeed(d / (timer / 3600 || 1));
  }, [locations, timer, getDistanceFromLatLonInKm]);

  // UI
  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Timer */}
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        {/* Play/Pause Button */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={() => setIsRunning(r => !r)}
            activeOpacity={0.8}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={48} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Distance */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={styles.bigNumber}>{distance.toFixed(2)}</Text>
          <Text style={styles.label}>distance (km)</Text>
        </View>

        {/* Avg Speed */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={styles.bigNumber}>{avgSpeed.toFixed(1)}</Text>
          <Text style={styles.label}>Avg. Speed (km/h)</Text>
        </View>

        {/* Checkpoints Remaining */}
        <View style={styles.checkpointsBox}>
          <Text style={styles.checkpointsText}>{`Checkpoints\nRemaining:`}</Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  timerBox: {
    backgroundColor: '#FDF0E0',
    borderRadius: 27,
    marginTop: Platform.OS === 'ios' ? 24 : 8,
    alignSelf: 'center',
    width: width - 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C0C0D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 40,
    color: '#000',
    letterSpacing: -1,
  },
  bigNumber: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 80,
    color: '#000',
    letterSpacing: -1,
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 28,
    color: '#000',
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 8,
  },
  checkpointsBox: {
    backgroundColor: '#FDF0E0',
    borderRadius: 20,
    padding: 16,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginTop: 32,
    shadowColor: '#0C0C0D',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkpointsText: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 22,
    color: '#000',
    letterSpacing: -1,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  navIcon: {
    backgroundColor: '#212529',
    borderRadius: 35,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  recordTabIcon: {
    borderWidth: 2,
    borderColor: '#FCAA12',
    backgroundColor: '#FCAA12',
  },
  playPauseBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FCAA12',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C0C0D',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 8,
  },
});
