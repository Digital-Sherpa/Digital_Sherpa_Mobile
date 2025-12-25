import Walking from "../models/Walking.js";
import { v2 as cloudinary } from 'cloudinary';

/**
 * Create a new walk with map snapshot
 */
export const createWalk = async (req, res) => {
  try {
    // Configure cloudinary here (after dotenv has loaded env vars in index.js)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const { userId, mapImage, timeRecorded, title, caption, stats, isPublic } = req.body;

    console.log("createWalk called with:", { userId, timeRecorded, title, hasMapImage: !!mapImage, mapImageLength: mapImage?.length });

    // Check for missing fields - use explicit checks since timeRecorded=0 is valid
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!mapImage) missingFields.push('mapImage');
    if (timeRecorded === undefined || timeRecorded === null) missingFields.push('timeRecorded');
    if (!title) missingFields.push('title');
    
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    let imageUrl = mapImage;
    if (mapImage && mapImage.startsWith('data:image')) {
      try {
        console.log("Uploading to Cloudinary...");
        const uploadRes = await cloudinary.uploader.upload(mapImage, {
          folder: "digital_sherpa_walks",
          resource_type: "image"
        });
        imageUrl = uploadRes.secure_url;
        console.log("Cloudinary upload success:", imageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
        // Return error if Cloudinary fails - don't save with base64 (it's too large for DB)
        return res.status(500).json({
          success: false,
          message: `Image upload failed: ${uploadError.message}. Please check Cloudinary config.`
        });
      }
    }

    const newWalk = new Walking({
      userId,
      mapImage: imageUrl,
      timeRecorded,
      title,
      caption,
      stats,
      isPublic: isPublic || false,
    });

    await newWalk.save();
    await newWalk.populate("userId", "name email avatar");

    console.log("Walk saved successfully:", newWalk._id);

    res.status(201).json({
      success: true,
      walk: newWalk,
    });
  } catch (error) {
    console.error("Error creating walk:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * Get community walks (public feed)
 */
export const getCommunityWalks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const walks = await Walking.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email avatar");

    res.json({
      success: true,
      walks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's walks
 */
export const getUserWalks = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    const walks = await Walking.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email avatar");

    res.json({
      success: true,
      walks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Like a walk
 */
export const likeWalk = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const walk = await Walking.findById(id);
    if (!walk) return res.status(404).json({ success: false, message: "Walk not found" });

    const isLiked = walk.likes.includes(userId);
    if (isLiked) {
      walk.likes = walk.likes.filter(uid => uid.toString() !== userId);
      walk.likesCount = Math.max(0, walk.likesCount - 1);
    } else {
      walk.likes.push(userId);
      walk.likesCount += 1;
    }

    await walk.save();

    // Return updated likes info
    res.json({ success: true, liked: !isLiked, likesCount: walk.likesCount, likes: walk.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add comment to a walk
 */
export const commentWalk = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    const walk = await Walking.findById(id);
    if (!walk) return res.status(404).json({ success: false, message: "Walk not found" });

    walk.comments.push({ userId, text });
    walk.commentsCount += 1;
    await walk.save();

    // Populate the new comment's user
    const updatedWalk = await Walking.findById(id).populate("comments.userId", "name email avatar");
    const newComment = updatedWalk.comments[updatedWalk.comments.length - 1];

    res.json({ success: true, comment: newComment, commentsCount: walk.commentsCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get comments for a walk
 */
export const getWalkComments = async (req, res) => {
  try {
    const { id } = req.params;
    const walk = await Walking.findById(id).populate("comments.userId", "name email avatar");
    if (!walk) return res.status(404).json({ success: false, message: "Walk not found" });

    // Sort comments by createdAt desc if needed, or keeping array order (asc)
    // Usually UI wants newest first
    const comments = walk.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Update a walk (e.g. make public)
 */
export const updateWalk = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic, title, caption } = req.body;

    const updateData = {};
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
    if (title) updateData.title = title;
    if (caption) updateData.caption = caption;

    const updatedWalk = await Walking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedWalk) {
      return res.status(404).json({ success: false, message: "Walk not found" });
    }

    res.json({ success: true, walk: updatedWalk });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
