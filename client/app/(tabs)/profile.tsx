
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');


const ProfileScreen = () => {
  const { user } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    languages: user?.languages?.join(', ') || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // State for journeys

  const [allJourneys, setAllJourneys] = useState<any[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);

  useEffect(() => {
    const fetchJourneys = async () => {
      if (!user?._id) return;
      setLoadingJourneys(true);
      try {
        const result = await api.getUserJourneys(user._id);
        setAllJourneys(result.journeys || []);
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoadingJourneys(false);
      }
    };
    fetchJourneys();
  }, [user?._id]);

  // Example stats, replace with real data as needed
  const sharedJourneys = allJourneys.filter(j => j.isPublic === false);
  const communityJourneys = allJourneys.filter(j => j.isPublic === true);
  const stats = [
    { label: 'Following', value: 308 },
    { label: 'Trails Completed', value: sharedJourneys.length },
    { label: 'Followers', value: 456 },
  ];

  // Pick image from gallery
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Show image picker options
  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Remove Photo', onPress: () => setProfileImage(null), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEditPress = () => {
    setEditModalVisible(true);
  };

  const handleFormChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare update payload (languages as array)
      const payload: any = { 
        ...form, 
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
        avatar: profileImage,
      };
      if (!payload.password) delete payload.password;
      await api.updateUserProfile(payload);
      Alert.alert('Success', 'Profile updated!');
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.topBg} />
        <TouchableOpacity style={styles.settingsIcon} onPress={handleEditPress}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileImageWrapper} onPress={handleEditPress} activeOpacity={0.8}>
            <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={{ width: 83, height: 83, borderRadius: 42 }} />
              ) : (
                <Ionicons name="person" size={60} color="#FFF" />
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
            <Text style={styles.profileDesc}>{user?.email || ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationRow} onPress={handleEditPress} activeOpacity={0.7}>
            <Ionicons name="location-sharp" size={16} color="#000" />
            <Text style={[styles.locationText, !user?.location && { color: '#EE5C19', fontStyle: 'italic' }]}> 
              {user?.location ? user.location : 'Add your Country Name'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
            <Text style={[styles.profileDesc, {marginTop: 4, color: user?.bio ? '#888' : '#EE5C19', fontStyle: user?.bio ? 'normal' : 'italic'}]}>
              {user?.bio ? user.bio : 'Add your bio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats - cleaner row */}
        <View style={styles.statsRowClean}>
          {stats.map((item, idx) => (
            <View key={item.label} style={[styles.statItemClean, idx === 1 && styles.statItemCenter]}>
              <Text style={styles.statValueClean}>{item.value}</Text>
              <Text style={styles.statLabelClean}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.achievementSectionClean}>
          <Text style={styles.achievementTitle}>Achievements</Text>
          <View style={styles.hexRowClean}>
            <Hexagon color="#DED8E1" />
            <Hexagon color="#25E88A" />
            <Hexagon color="#C6D6A3" />
            <Hexagon color="#E05A15" />
          </View>
        </View>

        {/* Cards - cleaner arrangement */}
        <View style={styles.cardsRowClean}>
          <View style={styles.cardClean}>
            <Text style={styles.cardTitleClean}>New places explored</Text>
            <Text style={styles.cardValueClean}>53</Text>
            <Text style={styles.cardSubtitleClean}>spots</Text>
          </View>
          <View style={styles.cardClean}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' }}
              style={styles.savedImageClean}
              resizeMode="cover"
            />
            <Text style={styles.savedLabelClean}>Saved Places</Text>
          </View>
        </View>

       
       
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '85%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Edit Profile</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Picture Section */}
              <View style={modalStyles.profilePictureSection}>
                <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
                  <View style={modalStyles.profileImageContainer}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={modalStyles.profileImagePreview} />
                    ) : (
                      <View style={modalStyles.profileImagePlaceholder}>
                        <Ionicons name="person" size={40} color="#888" />
                      </View>
                    )}
                    <View style={modalStyles.cameraOverlay}>
                      <Ionicons name="camera" size={18} color="#FFF" />
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={modalStyles.changePhotoText}>Tap to change photo</Text>
              </View>

              <TextInput
                style={modalStyles.input}
                placeholder="Name"
                value={form.name}
                onChangeText={v => handleFormChange('name', v)}
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={v => handleFormChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Password (leave blank to keep)"
                value={form.password}
                onChangeText={v => handleFormChange('password', v)}
                secureTextEntry
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Bio"
                value={form.bio}
                onChangeText={v => handleFormChange('bio', v)}
                multiline
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Location"
                value={form.location}
                onChangeText={v => handleFormChange('location', v)}
              />
              <TextInput
                style={modalStyles.input}
                placeholder="Phone"
                value={form.phone}
                onChangeText={v => handleFormChange('phone', v)}
                keyboardType="phone-pad"
              />

              <TextInput
                style={modalStyles.input}
                placeholder="Languages (comma separated)"
                value={form.languages}
                onChangeText={v => handleFormChange('languages', v)}
              />
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pressable onPress={() => setEditModalVisible(false)} style={modalStyles.cancelBtn}>
                <Text style={{ color: '#EE5C19', fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={modalStyles.saveBtn} disabled={isSaving}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
const modalStyles = StyleSheet.create({
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  profileImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#EE5C19',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EE5C19',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EE5C19',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#EE5C19',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#EE5C19',
  },
});

// Hexagon SVG shape (fallback: circle for mobile, or use SVG lib for real hex)
const Hexagon = ({ color }: { color: string }) => (
  <View style={{ marginHorizontal: 6 }}>
    <View
      style={{
        width: 36,
        height: 36,
        backgroundColor: color,
        borderRadius: 10,
        opacity: 0.9,
      }}
    />
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EDEE',
  },
  topBg: {
    position: 'absolute',
    width: width,
    height: 425,
    backgroundColor: '#FDF0E0',
    borderBottomLeftRadius: 27,
    borderBottomRightRadius: 27,
    top: 0,
    left: 0,
  },
  settingsIcon: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 90,
    marginBottom: 12,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 83,
    height: 83,
    borderRadius: 42,
    backgroundColor: '#D9D9D9',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EE5C19',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDF0E0',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 33,
    height: 33,
    borderRadius: 16.5,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  profileName: {
    fontFamily: 'Instrument Sans',
    fontWeight: '500',
    fontSize: 24,
    letterSpacing: -1,
    color: '#000',
    marginTop: 8,
  },
  profileDesc: {
    fontFamily: 'Instrument Sans',
    fontWeight: '400',
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontFamily: 'Instrument Sans',
    fontWeight: '400',
    fontSize: 13,
    color: '#000',
    marginLeft: 4,
  },
  // Clean stats row
  statsRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#F4E7D6',
    borderRadius: 18,
    paddingVertical: 18,
    elevation: 1,
  },
  statItemClean: {
    alignItems: 'center',
    flex: 1,
  },
  statItemCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FDAA2E44',
    marginHorizontal: 8,
    paddingHorizontal: 8,
  },
  statValueClean: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 22,
    color: '#EE5C19',
  },
  statLabelClean: {
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontSize: 13,
    color: '#FDAA2E',
    marginTop: 2,
  },
  // Achievements
  achievementSectionClean: {
    marginTop: 24,
    alignItems: 'center',
  },
  achievementTitle: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 16,
    color: '#EE5C19',
    marginBottom: 8,
  },
  hexRowClean: {
    flexDirection: 'row',
    marginTop: 4,
  },
  // Cards
  cardsRowClean: {
    flexDirection: 'row',
    marginTop: 28,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  cardClean: {
    flex: 1,
    backgroundColor: '#FDF0E0',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTitleClean: {
    fontFamily: 'Instrument Sans',
    fontWeight: '500',
    fontSize: 15,
    color: '#888',
    marginBottom: 4,
  },
  cardValueClean: {
    fontFamily: 'Instrument Sans',
    fontWeight: '700',
    fontSize: 32,
    color: '#000',
    marginTop: 2,
  },
  cardSubtitleClean: {
    fontFamily: 'Instrument Sans',
    fontWeight: '400',
    fontSize: 16,
    color: '#888',
    marginTop: 2,
  },
  savedImageClean: {
    width: 80,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
  },
  savedLabelClean: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 15,
    color: '#EE5C19',
    marginTop: 2,
  },
  journeysTitleClean: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 20,
    color: '#FDAA2E',
    marginLeft: 24,
    marginTop: 32,
  },
});

export default ProfileScreen;