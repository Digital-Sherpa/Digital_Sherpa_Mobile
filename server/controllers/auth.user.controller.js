import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Always set role to 'user' on registration
    const user = await User.create({ name, email, password, role: 'user' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "User registered successfully", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +role');
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Only allow login if user has 'user' role
    if (user.role !== 'user') {
      return res.status(403).json({ message: "Access denied: not a user account" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password from user object before sending
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({ message: "Login successful", token, user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile (except restricted fields)
export const updateUserProfile = async (req, res) => {
  try {
    // Assume user ID is available from authentication middleware (e.g., req.user.id)
    const userId = req.user?.id || req.body.userId; // fallback for dev/testing
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // List of fields user is allowed to update
    const allowedFields = [
      "name", "email", "password", "avatar", "bio", "location", "phone", "languages",
      "preferences", "totalDistance", "totalTrails", "points", "level",
      "favoritePlaces", "favoriteRoadmaps", "isActive", "isVerified", "verificationToken",
      "resetPasswordToken", "resetPasswordExpires", "lastLogin"
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Prevent updating restricted fields
    delete updates.role;
    delete updates.badges;
    delete updates.completedTrails;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
