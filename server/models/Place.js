import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
});

const entryFeeSchema = new mongoose.Schema({
  nepali: {
    type: Number,
    default: 0,
  },
  saarc: {
    type: Number,
    default: 0,
  },
  foreign: {
    type: Number,
    default: 0,
  },
});

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['historical', 'cultural', 'religious', 'nature', 'food', 'craft', 'adventure'],
    default: 'cultural',
  },
  coordinates: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  imageUrl: {
    type: String,
  },
  gallery: [{
    type: String,
  }],
  videoUrl: {
    type: String,
  },
  videos: [videoSchema],
  address: {
    type: String,
  },
  openingHours: {
    type: String,
  },
  entryFee: entryFeeSchema,
  tags: [{
    type: String,
  }],
  hasWorkshop: {
    type: Boolean,
    default: false,
  },
  isSponsored: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for search
placeSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Place = mongoose.model("Place", placeSchema);

export default Place;
