import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { registerUser, loginUser } from "./controllers/auth.user.controller.js";
import {
  getAllPlaces,
  getPlaceById,
  getPlaceBySlug,
  searchPlaces,
  createPlace,
  seedPlaces,
} from "./controllers/place.controller.js";
import {
  getAllRoadmaps,
  getRoadmapById,
  getRoadmapBySlug,
  searchRoadmaps,
  createRoadmap,
  getSuggestedRoadmaps,
} from "./controllers/roadmap.controller.js";
import {
  getAllEvents,
  getFeaturedEvents,
  getEventBySlug,
  getEventById,
  createEvent,
} from "./controllers/event.controller.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/register", registerUser);
app.post("/login", loginUser);

// Place endpoints (for map points/locations)
app.get("/places", getAllPlaces);
app.get("/places/search", searchPlaces);
app.get("/places/seed", seedPlaces);
app.get("/places/slug/:slug", getPlaceBySlug);
app.get("/places/:id", getPlaceById);
app.post("/places", createPlace);

// Roadmap endpoints
app.get("/roadmaps", getAllRoadmaps);
app.get("/roadmaps/search", searchRoadmaps);
app.get("/roadmaps/slug/:slug", getRoadmapBySlug);
app.get("/roadmaps/:id", getRoadmapById);
app.post("/roadmaps", createRoadmap);

// Suggested roadmaps (for homepage) - only roadmaps, no places
app.get("/suggested", getSuggestedRoadmaps);

// Event endpoints
app.get("/events", getAllEvents);
app.get("/events/featured", getFeaturedEvents);
app.get("/events/slug/:slug", getEventBySlug);
app.get("/events/:id", getEventById);
app.post("/events", createEvent);

// Seed all data
app.get("/seed-all", async (req, res) => {
  try {
    // Import models to check counts
    const Place = (await import("./models/Place.js")).default;
    const Roadmap = (await import("./models/Roadmap.js")).default;
    
    let placesCreated = 0;
    let roadmapsCreated = 0;
    
    // Seed places first
    const placeCount = await Place.countDocuments();
    if (placeCount === 0) {
      const samplePlaces = [
        {
          name: "Bhaktapur Durbar Square",
          slug: "bhaktapur-durbar-square",
          description: "UNESCO World Heritage Site featuring stunning Newari architecture.",
          category: "historical",
          coordinates: { lat: 27.672108, lng: 85.42834 },
          imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1766149091/bhkt_h3dqpg.jpg",
          tags: ["heritage", "temple", "UNESCO"],
        },
        {
          name: "Peacock Window",
          slug: "peacock-window",
          description: "The famous 15th-century carved wooden window.",
          category: "historical",
          coordinates: { lat: 27.6710, lng: 85.4275 },
          tags: ["woodcarving", "art"],
        },
        {
          name: "Suwal Woodcarving Workshop",
          slug: "suwal-woodcarving",
          description: "Traditional woodcarving workshop.",
          category: "craft",
          coordinates: { lat: 27.6705, lng: 85.4260 },
          hasWorkshop: true,
          tags: ["workshop", "craft"],
        },
        {
          name: "Cafe Nyatapola",
          slug: "cafe-nyatapola",
          description: "Rooftop cafe with temple views.",
          category: "food",
          coordinates: { lat: 27.6718, lng: 85.4285 },
          isSponsored: true,
          tags: ["cafe", "food"],
        },
        {
          name: "Nyatapola Temple",
          slug: "nyatapola-temple",
          description: "Nepal's tallest traditional temple.",
          category: "religious",
          coordinates: { lat: 27.6720, lng: 85.4288 },
          tags: ["temple", "pagoda"],
        },
        {
          name: "Pottery Square",
          slug: "pottery-square",
          description: "Open-air pottery market.",
          category: "craft",
          coordinates: { lat: 27.6703, lng: 85.4252 },
          hasWorkshop: true,
          tags: ["pottery", "craft"],
        },
      ];
      await Place.insertMany(samplePlaces);
      placesCreated = samplePlaces.length;
    }
    
    // Note: Roadmaps are already in the 'roadmaps' collection in MongoDB
    // No need to seed them here - they're managed separately
    const roadmapCount = await Roadmap.countDocuments();
    
    res.json({
      success: true,
      message: "Seed completed",
      placesCreated,
      roadmapsCreated,
      totalPlaces: await Place.countDocuments(),
      totalRoadmaps: roadmapCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});