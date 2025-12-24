import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ReactNode } from 'react';

interface BackgroundProps {
  children: ReactNode;
}

export function Background({ children }: BackgroundProps) {
  return (
    <View className="flex-1 #F0EDEE">
      <Image
        source={require('@/assets/images/Hello World.svg')}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        contentFit="cover"
      />
      <View className="flex-1">
        {children}
      </View>
    </View>
  );
}
