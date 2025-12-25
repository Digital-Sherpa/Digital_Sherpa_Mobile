// import Route from "../models/Route.js";

// // Get all routes
// export const getAllRoutes = async (req, res) => {
//   try {
//     const routes = await Route.find({ isActive: true }).select('name description category duration difficulty stops coverImage');
//     res.status(200).json({ routes });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch routes", error: error.message });
//   }
// };

// // Get single route by ID
// export const getRouteById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const route = await Route.findById(id);
    
//     if (!route) {
//       return res.status(404).json({ message: "Route not found" });
//     }
    
//     res.status(200).json({ route });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch route", error: error.message });
//   }
// };

// // Create a new route (admin use)
// export const createRoute = async (req, res) => {
//   try {
//     const { name, description, category, duration, difficulty, stops, coverImage } = req.body;
    
//     if (!name || !stops || stops.length === 0) {
//       return res.status(400).json({ message: "Route name and at least one stop are required" });
//     }
    
//     const route = new Route({
//       name,
//       description,
//       category,
//       duration,
//       difficulty,
//       stops,
//       coverImage,
//     });
    
//     await route.save();
//     res.status(201).json({ message: "Route created successfully", route });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to create route", error: error.message });
//   }
// };

// // Update user progress on a route
// export const updateRouteProgress = async (req, res) => {
//   try {
//     const { routeId, completedStopIndex } = req.body;
//     // This would typically update a UserProgress collection
//     // For now, we just return success
//     res.status(200).json({ message: "Progress updated", routeId, completedStopIndex });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to update progress", error: error.message });
//   }
// };

// // Search routes by name or category
// export const searchRoutes = async (req, res) => {
//   try {
//     const { query, category } = req.query;
    
//     let filter = { isActive: true };
    
//     if (query) {
//       filter.$or = [
//         { name: { $regex: query, $options: 'i' } },
//         { description: { $regex: query, $options: 'i' } },
//       ];
//     }
    
//     if (category) {
//       filter.category = category;
//     }
    
//     const routes = await Route.find(filter).select('name description category duration difficulty stops coverImage');
//     res.status(200).json({ routes });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to search routes", error: error.message });
//   }
// };

// // Seed sample route data (for development)
// export const seedRoutes = async (req, res) => {
//   try {
//     // Check if routes already exist
//     const existingRoutes = await Route.countDocuments();
//     if (existingRoutes > 0) {
//       return res.status(200).json({ message: "Routes already seeded", count: existingRoutes });
//     }
    
//     const sampleRoutes = [
//       {
//         name: "Bhaktapur Heritage Walk",
//         description: "Explore the ancient city of Bhaktapur with its stunning architecture and rich culture",
//         category: "cultural",
//         duration: "2-3 hours",
//         difficulty: "easy",
//         stops: [
//           {
//             name: "Bhaktapur Durbar Square Gate",
//             description: "The main entrance to the historic Durbar Square",
//             lat: 27.6722,
//             lng: 85.4279,
//             order: 1,
//           },
//           {
//             name: "Dattatreya Temple",
//             description: "A historic temple dedicated to the deity Dattatreya",
//             lat: 27.6731,
//             lng: 85.4321,
//             order: 2,
//           },
//           {
//             name: "Aama's Bara Shop",
//             description: 'Authentic Famous place to get "Bara", a traditional newari dish made from pulses',
//             lat: 27.6715,
//             lng: 85.4298,
//             order: 3,
//           },
//           {
//             name: "Main Durbar Square",
//             description: "The heart of Bhaktapur with the 55-window palace",
//             lat: 27.6719,
//             lng: 85.4267,
//             order: 4,
//           },
//         ],
//       },
//       {
//         name: "Kathmandu Temple Trail",
//         description: "Visit the most sacred temples in Kathmandu Valley",
//         category: "religious",
//         duration: "4-5 hours",
//         difficulty: "moderate",
//         stops: [
//           {
//             name: "Pashupatinath Temple",
//             description: "One of the most sacred Hindu temples dedicated to Lord Shiva",
//             lat: 27.7107,
//             lng: 85.3485,
//             order: 1,
//           },
//           {
//             name: "Boudhanath Stupa",
//             description: "One of the largest spherical stupas in Nepal",
//             lat: 27.7215,
//             lng: 85.3620,
//             order: 2,
//           },
//           {
//             name: "Swayambhunath (Monkey Temple)",
//             description: "Ancient religious complex atop a hill overlooking Kathmandu",
//             lat: 27.7149,
//             lng: 85.2903,
//             order: 3,
//           },
//         ],
//       },
//       {
//         name: "Newari Food Tour",
//         description: "Taste the authentic flavors of Newari cuisine",
//         category: "food",
//         duration: "3-4 hours",
//         difficulty: "easy",
//         stops: [
//           {
//             name: "Honacha Restaurant",
//             description: "Famous for traditional Newari thali",
//             lat: 27.6725,
//             lng: 85.4285,
//             order: 1,
//           },
//           {
//             name: "Juju Dhau Shop",
//             description: "Try the famous King Curd of Bhaktapur",
//             lat: 27.6718,
//             lng: 85.4290,
//             order: 2,
//           },
//           {
//             name: "Local Sekuwa Corner",
//             description: "Grilled meat Newari style",
//             lat: 27.6730,
//             lng: 85.4275,
//             order: 3,
//           },
//         ],
//       },
//     ];
    
//     await Route.insertMany(sampleRoutes);
//     res.status(201).json({ message: "Sample routes seeded successfully", count: sampleRoutes.length });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to seed routes", error: error.message });
//   }
// };
