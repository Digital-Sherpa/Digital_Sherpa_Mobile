import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Background } from '@/components/background';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.register({ name, email, password });
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Something went wrong');
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
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="flex-1 px-8"
        >
        {/* Header */}
        <View className="mb-10 mt-20">
          <Text className="text-black text-3xl font-bold mb-2">Create Account</Text>
          <Text className="text-gray-600 text-base">Sign up to get started</Text>
        </View>

        {/* Form */}
        <View className="gap-4 mb-6">
          <View>
            <Text className="text-gray-600 mb-2 text-sm">Full Name</Text>
            <TextInput
              className="bg-slate-300 text-white px-4 py-4 rounded-xl text-base"
              placeholder="Enter your full name"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={setName}
            />
          </View>

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
              placeholder="Create a password"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View>
            <Text className="text-gray-600 mb-2 text-sm">Confirm Password</Text>
            <TextInput
              className="bg-slate-300 text-white px-4 py-4 rounded-xl text-base"
              placeholder="Confirm your password"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <Pressable
          className="bg-[#E45C12] py-4 rounded-xl items-center active:bg-[#E05A15] mb-6"
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Create Account</Text>
          )}
        </Pressable>

        
        <View className="flex-row justify-center mb-10">
          <Text className="text-gray-400">Already have an account? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text className="text-[#E45C12] font-semibold">Login</Text>
          </Pressable>
        </View>
      </ScrollView>

          {/* Back Button */}
          {/* <Pressable 
            className="absolute top-4 left-6"
            onPress={() => router.back()}
          >
            <Text className="text-blue-400 text-lg">← Back</Text>
          </Pressable> */}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}
