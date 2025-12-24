import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { HomeIcon, ExploreIcon, HeartIcon, ProfileIcon, RecordButton } from '@/components/icons';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e293b',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopWidth: 0,
          width: 380,
          height: 70,
          alignSelf: 'center',
          marginBottom: 17,
          borderRadius: 35,
          paddingHorizontal: 10,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused ? styles.activeContainer : styles.inactiveContainer]}>
              <HomeIcon size={22} color={focused ? '#1e293b' : '#ffffff'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused ? styles.activeContainer : styles.inactiveContainer]}>
              <ExploreIcon size={22} color={focused ? '#1e293b' : '#ffffff'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <RecordButton size={75} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused ? styles.activeContainer : styles.inactiveContainer]}>
              <HeartIcon size={22} color={focused ? '#1e293b' : '#ffffff'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused ? styles.activeContainer : styles.inactiveContainer]}>
              <ProfileIcon size={22} color={focused ? '#1e293b' : '#ffffff'} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    marginTop: 45,
    width: 53,
    height: 53,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    backgroundColor: '#ffffff',
  },
  inactiveContainer: {
    backgroundColor: 'transparent',
  },
  centerButton: {
    marginTop: 20,
  },
});


