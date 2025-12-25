import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  address: String,
  note: String,
});

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    category: String,
    startDate: Date,
    endDate: Date,
    startTime: String,
    endTime: String,
    isAllDay: Boolean,
    isRecurring: Boolean,
    recurringPattern: String,
    locations: [LocationSchema],
    imageUrl: String,
    gallery: [String],
    videoUrl: String,
    entryFee: {
      isFree: Boolean,
      price: Number,
      note: String,
    },
    organizer: String,
    contactInfo: String,
    website: String,
    color: String,
    icon: String,
    tags: [String],
    isFeatured: Boolean,
    isActive: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
