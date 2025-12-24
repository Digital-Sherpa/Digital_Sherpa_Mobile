import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, G } from 'react-native-svg';

interface RecordButtonProps {
  size?: number;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ size = 50 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <Defs>
          <LinearGradient id="gradient" x1="35" y1="0" x2="6" y2="21" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FCAA12" />
            <Stop offset="1" stopColor="#D94B2E" />
          </LinearGradient>
        </Defs>
        <Circle cx="28" cy="28" r="28" fill="url(#gradient)" />
        {/* Paper plane icon - centered */}
        <G transform="translate(6, 11)">
          <Path
            d="M36.3923 4.3033C35.5586 3.44766 34.3248 3.12889 33.1743 3.46444L6.34666 11.2659C5.13283 11.6031 4.27248 12.5711 4.04072 13.8009C3.80395 15.0525 4.63096 16.6413 5.7114 17.3057L14.0998 22.4613C14.9602 22.9898 16.0706 22.8573 16.7826 22.1392L26.3882 12.4738C26.8717 11.9705 27.6721 11.9705 28.1556 12.4738C28.6391 12.9604 28.6391 13.7489 28.1556 14.2522L18.5333 23.9193C17.8197 24.6357 17.6863 25.7514 18.2115 26.6171L23.337 35.0896C23.9372 36.0962 24.971 36.6667 26.1047 36.6667C26.2381 36.6667 26.3882 36.6667 26.5216 36.6499C27.8221 36.4821 28.8559 35.5929 29.2394 34.3346L37.1926 7.54132C37.5428 6.40046 37.226 5.15894 36.3923 4.3033Z"
            fill="white"
            scale={0.95}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#0C0C0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
});
