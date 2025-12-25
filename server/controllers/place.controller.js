import Place from "../models/Place.js";

// Get all places
export const getAllPlaces = async (req, res) => {
  try {
    const { category, hasWorkshop } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (hasWorkshop !== undefined) filter.hasWorkshop = hasWorkshop === 'true';
    
    const places = await Place.find(filter).sort({ name: 1 });
    res.json({ success: true, places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get place by ID
export const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.json({ success: true, place });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get place by slug
export const getPlaceBySlug = async (req, res) => {
  try {
    const place = await Place.findOne({ slug: req.params.slug });
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }
    res.json({ success: true, place });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search places
export const searchPlaces = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    
    const places = await Place.find(filter).sort({ name: 1 });
    res.json({ success: true, places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create place
export const createPlace = async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    res.status(201).json({ success: true, place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Seed sample places
export const seedPlaces = async (req, res) => {
  try {
    const existingCount = await Place.countDocuments();
    if (existingCount > 0) {
      return res.json({ success: true, message: "Places already exist", count: existingCount });
    }

    const samplePlaces = [
      {
        name: "Bhaktapur Durbar Square",
        slug: "bhaktapur-durbar-square",
        description: "UNESCO World Heritage Site featuring stunning Newari architecture, ancient temples, and the famous 55-window palace.",
        category: "historical",
        coordinates: { lat: 27.672108, lng: 85.42834 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1766149091/bhkt_h3dqpg.jpg",
        address: "Durbar Square, Bhaktapur",
        openingHours: "6:00 AM - 6:00 PM",
        entryFee: { nepali: 0, saarc: 500, foreign: 1500 },
        tags: ["heritage", "temple", "architecture", "UNESCO"],
      },
      {
        name: "Peacock Window",
        slug: "peacock-window",
        description: "The famous 15th-century carved wooden window depicting a peacock, considered a masterpiece of Newari woodcarving.",
        category: "historical",
        coordinates: { lat: 27.6710, lng: 85.4275 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/peacock-window.jpg",
        address: "Tachapal Tole, Bhaktapur",
        tags: ["woodcarving", "art", "heritage"],
      },
      {
        name: "Suwal Woodcarving Workshop",
        slug: "suwal-woodcarving",
        description: "Traditional Newari woodcarving workshop offering hands-on classes and demonstrations.",
        category: "craft",
        coordinates: { lat: 27.6705, lng: 85.4260 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/woodcarving.jpg",
        address: "Pottery Square, Bhaktapur",
        tags: ["workshop", "craft", "woodcarving"],
        hasWorkshop: true,
      },
      {
        name: "Cafe Nyatapola",
        slug: "cafe-nyatapola",
        description: "Rooftop cafe with stunning views of Nyatapola Temple and Taumadhi Square.",
        category: "food",
        coordinates: { lat: 27.6718, lng: 85.4285 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/cafe.jpg",
        address: "Taumadhi Square, Bhaktapur",
        openingHours: "8:00 AM - 8:00 PM",
        tags: ["cafe", "food", "view"],
        isSponsored: true,
      },
      {
        name: "Nyatapola Temple",
        slug: "nyatapola-temple",
        description: "Nepal's tallest traditional temple, a five-story pagoda standing at 30 meters, built in 1702.",
        category: "religious",
        coordinates: { lat: 27.6720, lng: 85.4288 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/nyatapola.jpg",
        address: "Taumadhi Square, Bhaktapur",
        tags: ["temple", "pagoda", "heritage"],
      },
      {
        name: "Pottery Square",
        slug: "pottery-square",
        description: "Open-air pottery market where traditional potters create and sell handmade ceramics.",
        category: "craft",
        coordinates: { lat: 27.6703, lng: 85.4252 },
        imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/pottery.jpg",
        address: "Pottery Square, Bhaktapur",
        tags: ["pottery", "craft", "market"],
        hasWorkshop: true,
      },
    ];

    await Place.insertMany(samplePlaces);
    res.json({ success: true, message: "Sample places created", count: samplePlaces.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
