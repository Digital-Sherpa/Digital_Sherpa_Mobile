import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, Walking } from '@/services/api';
import { Background } from '@/components/background';

const { width } = Dimensions.get('window');

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

interface YourWalkCardProps {
  walk: Walking;
  onShare: (walk: Walking) => void;
}

const YourWalkCard = ({ walk, onShare }: YourWalkCardProps) => {
  return (
    <View style={styles.yourJourneyCard}>
      {/* Map Image Thumbnail */}
      {walk.mapImage ? (
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: walk.mapImage }} style={styles.thumbnailImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.journeyIconContainer}>
          <View style={styles.journeyIcon}>
            <Ionicons name="map-outline" size={24} color="#E45C12" />
          </View>
        </View>
      )}
      <View style={styles.journeyInfo}>
        <View style={styles.journeyHeader}>
          <Text style={styles.journeyTitle} numberOfLines={1}>{walk.title}</Text>
          {walk.isPublic ? (
             <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, color: '#1976D2', fontWeight: '600' }}>SHARED</Text>
             </View>
          ) : (
             <TouchableOpacity 
                onPress={() => onShare(walk)}
                style={{ backgroundColor: '#E45C12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
             >
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>SHARE</Text>
             </TouchableOpacity>
          )}
        </View>
        <View style={styles.journeyStats}>
          <View style={styles.statItem}>
            <Ionicons name="walk-outline" size={12} color="#666" />
            <Text style={styles.statText}>{formatDistance(walk.stats?.distance || 0)}</Text>
          </View>
          <View style={styles.statItem}>
             <Ionicons name="flame-outline" size={12} color="#666" />
             <Text style={styles.statText}>{walk.stats?.calories || 0} cal</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.statText}>{formatDuration(walk.timeRecorded || 0)}</Text>
          </View>
        </View>
        <Text style={styles.completedText}>
          {timeAgo(walk.createdAt)}
        </Text>
      </View>
    </View>
  );
};

interface CommunityWalkCardProps {
  walk: Walking;
  currentUserId: string;
  onLike: (walkId: string) => void;
  onComment: (walk: Walking) => void;
}

const CommunityWalkCard = ({ walk, currentUserId, onLike, onComment }: CommunityWalkCardProps) => {
  const user = typeof walk.userId === 'object' ? walk.userId : { name: 'User', avatar: '' };
  const isLiked = walk.likes?.includes(currentUserId);

  return (
    <View style={styles.communityCard}>
      <View style={styles.communityHeader}>
        <View style={styles.userAvatar}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.journeyTime}>{timeAgo(walk.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.communityTitle}>{walk.title}</Text>
      {walk.caption ? <Text style={styles.locationText}>{walk.caption}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Ionicons name="walk" size={14} color="#E45C12" />
          <Text style={styles.statBadgeLabel}>DIST</Text>
          <Text style={styles.statBadgeValue}>{formatDistance(walk.stats?.distance || 0)}</Text>
        </View>
        <View style={styles.statBadge}>
           <Ionicons name="flame" size={14} color="#E45C12" />
           <Text style={styles.statBadgeLabel}>CAL</Text>
           <Text style={styles.statBadgeValue}>{walk.stats?.calories || 0}</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.statBadgeLabel}>TIME</Text>
          <Text style={styles.statBadgeValue}>{formatDuration(walk.timeRecorded || 0)}</Text>
        </View>
      </View>

      {/* Map Image */}
      {walk.mapImage ? (
        <Image source={{ uri: walk.mapImage }} style={styles.trackImage} resizeMode="cover" />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#ccc" />
        </View>
      )}

      <View style={styles.socialActions}>
        <TouchableOpacity style={styles.socialButton} onPress={() => onLike(walk._id)}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? "#E45C12" : "#666"} 
          />
          <Text style={styles.socialCount}>{walk.likesCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => onComment(walk)}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.socialCount}>{walk.commentsCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SocialScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [myWalks, setMyWalks] = useState<Walking[]>([]);
  const [communityWalks, setCommunityWalks] = useState<Walking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedWalk, setSelectedWalk] = useState<Walking | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [myRes, communityRes] = await Promise.all([
        user?._id ? api.getUserWalks(user._id) : Promise.resolve({ walks: [] }),
        api.getCommunityWalks(),
      ]);
      
      setMyWalks(myRes.walks || []);
      setCommunityWalks(communityRes.walks || []);
    } catch (error) {
      console.error('Failed to fetch walks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLike = async (walkId: string) => {
    if (!user?._id) return;
    try {
      const result = await api.likeWalk(walkId, user._id);
      setCommunityWalks(prev =>
        prev.map(w =>
          w._id === walkId
            ? { ...w, likesCount: result.likesCount, likes: result.liked ? [...(w.likes || []), user._id] : w.likes?.filter(id => id !== user._id) }
            : w
        )
      );
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleOpenComments = async (walk: Walking) => {
    setSelectedWalk(walk);
    setShowCommentsModal(true);
    try {
      const result = await api.getWalkComments(walk._id);
      setComments(result.comments || []);
    } catch (error) {
      console.error('Failed to get comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user?._id || !selectedWalk || !newComment.trim()) return;
    try {
      const result = await api.commentWalk(selectedWalk._id, user._id, newComment.trim());
      // Re-fetch comments to get populated user info
      const commentsRes = await api.getWalkComments(selectedWalk._id);
      setComments(commentsRes.comments || []);
      setNewComment('');
      
      setCommunityWalks(prev =>
        prev.map(w =>
           w._id === selectedWalk._id ? { ...w, commentsCount: result.commentsCount } : w
        )
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };



  const handleShareWalk = async (walk: Walking) => {
    Alert.alert(
        "Share to Community",
        "Do you want to share this walk to the public community feed?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Share", 
                onPress: async () => {
                    try {
                        await api.updateWalk(walk._id, { isPublic: true });
                        fetchData(true);
                        Alert.alert("Success", "Your walk is now public!");
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Error", "Failed to share walk.");
                    }
                }
            }
        ]
    );
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSubtitle}>Explore walks from the community</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchData(true)}
              colors={['#E45C12']}
              tintColor="#E45C12"
            />
          }
        >
          {/* Your Walks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Walks</Text>
            <Text style={styles.sectionSubtitle}>Walks you have recorded</Text>

            {isLoading ? (
              <ActivityIndicator size="small" color="#E45C12" style={{ marginVertical: 20 }} />
            ) : myWalks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No walks recorded yet</Text>
                <Text style={styles.emptySubtext}>Go to Explore and record your first walk!</Text>
                <TouchableOpacity 
                    style={styles.goRecordButton}
                    onPress={() => {
                      router.push('/(tabs)/explore');
                    }}
                >
                    <Text style={styles.goRecordText}>Start Walking</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myWalks.map((walk) => (
                <YourWalkCard key={walk._id} walk={walk} onShare={handleShareWalk} />
              ))
            )}
          </View>

          {/* Community Walks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Community Feed</Text>
                <Text style={styles.sectionSubtitle}>See what others are exploring</Text>
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color="#E45C12" style={{ marginVertical: 20 }} />
            ) : communityWalks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No community walks yet</Text>
                <Text style={styles.emptySubtext}>Be the first to share your adventure!</Text>
              </View>
            ) : (
              communityWalks.map((walk) => (
                <CommunityWalkCard
                  key={walk._id}
                  walk={walk}
                  currentUserId={user?._id || ''}
                  onLike={handleLike}
                  onComment={handleOpenComments}
                />
              ))
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comments Modal */}
        <Modal
          visible={showCommentsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCommentsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '70%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.commentsList}>
                {comments.length === 0 ? (
                  <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                ) : (
                  comments.map((comment) => (
                    <View key={comment._id || Math.random()} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        {comment.userId && comment.userId.avatar ? (
                             <Image source={{ uri: comment.userId.avatar }} style={styles.commentAvatarImage} />
                        ) : (
                             <Ionicons name="person" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUser}>{comment.userId?.name || 'User'}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#999"
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                  <Ionicons name="send" size={20} color="#E45C12" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cancelOptionButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  manualHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  manualEntryForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
  },
  submitManualButton: {
    backgroundColor: '#E45C12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitManualText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourJourneyCard: {
    backgroundColor: '#FDF0E0',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnailImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  journeyIconContainer: {
    marginRight: 12,
  },
  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedIndicator: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  journeyInfo: {
    flex: 1,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  yoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yoursText: {
    fontSize: 10,
    color: '#E45C12',
    fontWeight: '600',
  },
  journeyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  journeyMetaText: {
    fontSize: 12,
    color: '#666',
  },
  journeyStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  completedText: {
    fontSize: 11,
    color: '#E45C12',
    marginTop: 8,
  },
  shareButton: {
    marginLeft: 8,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  communityCard: {
    backgroundColor: '#FDF0E0',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E45C12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  journeyTime: {
    fontSize: 12,
    color: '#666',
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statBadgeLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  statBadgeValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
  trackImage: {
    height: 180,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 24,
  },
  socialCount: {
    fontSize: 14,
    color: '#666',
  },
  shareOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#E45C12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareOutlineText: {
    color: '#E45C12',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  cancelText: {
    fontSize: 16,
    color: '#E45C12',
  },
  selectedJourneyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  editBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  captionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  shareJourneyButton: {
    marginTop: 20,
  },
  shareJourneyGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareJourneyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentsList: {
    maxHeight: 300,
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E45C12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Journey Picker styles
  emptyPickerState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  goRecordButton: {
    marginTop: 16,
    backgroundColor: '#E45C12',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  goRecordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  journeyPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  journeyPickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FDF0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  journeyPickerInfo: {
    flex: 1,
  },
  journeyPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  journeyPickerMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  journeyPickerDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noJourneySelected: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  noJourneyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  selectJourneyButton: {
    backgroundColor: '#E45C12',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectJourneyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
