import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/background';

export default function FavoritesScreen() {
  return (
    <Background>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1">
          <View className="px-6 pt-4 pb-8">
            <Text className="text-white text-2xl font-bold mb-2">Favorites</Text>
            <Text className="text-gray-400 text-base">
              Your saved items will appear here
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}
