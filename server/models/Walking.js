import mongoose from "mongoose";

const walkingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    mapImage: {
        type: String, // Base64 string or URL
        required: true,
    },
    timeRecorded: {
        type: Number, // duration in seconds
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        default: "",
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    stats: {
        distance: { type: Number, default: 0 }, // in meters
        calories: { type: Number, default: 0 },
        steps: { type: Number, default: 0 },
        avgSpeed: { type: Number, default: 0 },
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    likesCount: {
        type: Number,
        default: 0,
    },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    commentsCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

walkingSchema.index({ userId: 1, createdAt: -1 });
walkingSchema.index({ createdAt: -1 }); // For community feed

export default mongoose.model("Walking", walkingSchema);
