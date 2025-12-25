import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  placeSlug: { type: String, required: true },
  duration: String,
  note: String,
  isWorkshop: { type: Boolean, default: false },
});

const sponsoredStopSchema = new mongoose.Schema({
  afterStop: { type: Number, required: true },
  placeSlug: { type: String, required: true },
  note: String,
});

const roadmapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    category: String,
    difficulty: { type: String, enum: ["easy", "moderate", "hard"], default: "easy" },
    duration: String,
    distance: String,
    color: { type: String, default: "#E45C12" },
    icon: String,
    stops: [stopSchema],
    sponsoredStops: [sponsoredStopSchema],
    tags: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Use 'roadmaps' collection in MongoDB
const Roadmap = mongoose.model("Roadmap", roadmapSchema, "roadmaps");

export default Roadmap;
