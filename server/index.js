import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

// Auth controllers
import { registerUser, loginUser, updateUserProfile } from "./controllers/auth.user.controller.js";

// Place controllers
import {
  getAllPlaces,
  getPlaceById,
  getPlaceBySlug,
  searchPlaces,
  createPlace,
  seedPlaces,
} from "./controllers/place.controller.js";

// Roadmap controllers
import {
  getAllRoadmaps,
  getRoadmapById,
  getRoadmapBySlug,
  searchRoadmaps,
  createRoadmap,
  getSuggestedRoadmaps,
} from "./controllers/roadmap.controller.js";

// Event controllers
import {
  getAllEvents,
  getFeaturedEvents,
  getEventBySlug,
  getEventById,
  createEvent,
} from "./controllers/event.controller.js";

// Walking controllers
import {
  createWalk,
  getCommunityWalks,
  getUserWalks,
  likeWalk,
  commentWalk,
  getWalkComments,
  updateWalk
} from "./controllers/walking.controller.js";



dotenv.config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===== Auth Routes =====
app.post("/register", registerUser);
app.post("/login", loginUser);
app.put("/user/profile", updateUserProfile);

// ===== Place Routes =====
app.get("/places", getAllPlaces);
app.get("/places/search", searchPlaces);
app.get("/places/seed", seedPlaces);
app.get("/places/slug/:slug", getPlaceBySlug);
app.get("/places/:id", getPlaceById);
app.post("/places", createPlace);

// ===== Roadmap Routes =====
app.get("/roadmaps", getAllRoadmaps);
app.get("/roadmaps/search", searchRoadmaps);
app.get("/roadmaps/slug/:slug", getRoadmapBySlug);
app.get("/roadmaps/:id", getRoadmapById);
app.post("/roadmaps", createRoadmap);

// Suggested roadmaps (for homepage)
app.get("/suggested", getSuggestedRoadmaps);

// ===== Event Routes =====
app.get("/events", getAllEvents);
app.get("/events/featured", getFeaturedEvents);
app.get("/events/slug/:slug", getEventBySlug);
app.get("/events/:id", getEventById);
app.post("/events", createEvent);

// ===== Walking Routes =====
app.post("/walking", createWalk);
app.get("/walking/community", getCommunityWalks);
app.get("/walking/user", getUserWalks);
app.put("/walking/:id", updateWalk);
app.post("/walking/:id/like", likeWalk);
app.post("/walking/:id/comment", commentWalk);
app.get("/walking/:id/comments", getWalkComments);


app.get("/seed-all", async (req, res) => {
  try {
    const Place = (await import("./models/Place.js")).default;
    const Roadmap = (await import("./models/Roadmap.js")).default;

    let placesCreated = 0;
    let roadmapsCreated = 0;

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