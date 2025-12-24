import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Background } from '@/components/background';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    router.replace('/(tabs)');
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      await login(response.token, response.user);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Background>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-center px-8">
          {/* Header */}
          <View className="mb-10 items-center">
            <Text className=" text-3xl font-bold mb-2">Welcome Back</Text>
            <Text className="text-gray-600 text-base">Sign in to continue</Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-8">
            <View>
              <Text className="text-gray-600 mb-2 text-sm">Email</Text>
              <TextInput
                className="bg-slate-300 text-white px-4 py-4 rounded-xl text-base"
                placeholder="Enter your email"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-gray-600 mb-2 text-sm">Password</Text>
              <TextInput
                className="bg-slate-300 text-white px-4 py-4 rounded-xl text-base"
                placeholder="Enter your password"
                placeholderTextColor="#6b7280"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* <Pressable className="self-end">
              <Text className="text-blue-400 text-sm">Forgot Password?</Text>
            </Pressable> */}
          </View>

          {/* Login Button */}
          <Pressable
            className="bg-[#E45C12] py-4 rounded-xl items-center active:bg-[#E05A15] mb-6"
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Login</Text>
            )}
          </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600">Don&apos;t have an account? </Text>
              <Pressable onPress={() => router.push('/signup')}>
                <Text className="text-[#E05A15] font-semibold">Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}
