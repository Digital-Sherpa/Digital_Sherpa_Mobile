
import mongoose from "mongoose";

// Dummy schemas to prevent registration errors if not defined elsewhere
const badgeSchema = new mongoose.Schema({}, { _id: false });
const completedTrailSchema = new mongoose.Schema({}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+.\S+$/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  avatar: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },

  // Profile info
  bio: { type: String, maxlength: 500 },
  location: { type: String },
  phone: { type: String },
  languages: [{ type: String }],

  // Preferences
  preferences: {
    favoriteCategories: [{ type: String }],
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },

  // Gamification
  badges: [badgeSchema],
  completedTrails: [completedTrailSchema],
  totalDistance: { type: Number, default: 0 },
  totalTrails: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // Favorites
  favoritePlaces: [{ type: String }], 
  favoriteRoadmaps: [{ type: String }], 

  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Timestamps
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
