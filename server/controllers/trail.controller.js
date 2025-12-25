// import Trail from "../models/Trail.js";
// import Place from "../models/Place.js";

// // Get all trails with populated place data
// export const getAllTrails = async (req, res) => {
//   try {
//     const { category, difficulty, isActive } = req.query;
//     const filter = {};
    
//     if (category) filter.category = category;
//     if (difficulty) filter.difficulty = difficulty;
//     if (isActive !== undefined) filter.isActive = isActive === 'true';
    
//     const trails = await Trail.find(filter).sort({ name: 1 });
    
//     // Populate place data for each stop
//     const populatedTrails = await Promise.all(
//       trails.map(async (trail) => {
//         const trailObj = trail.toObject();
        
//         // Get all unique place slugs from stops
//         const placeSlugs = [...new Set(trailObj.stops.map(stop => stop.placeSlug))];
//         const sponsoredSlugs = trailObj.sponsoredStops?.map(s => s.placeSlug) || [];
//         const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
        
//         // Fetch places
//         const places = await Place.find({ slug: { $in: allSlugs } });
//         const placeMap = {};
//         places.forEach(place => {
//           placeMap[place.slug] = place;
//         });
        
//         // Attach place data to stops
//         trailObj.stops = trailObj.stops.map(stop => ({
//           ...stop,
//           place: placeMap[stop.placeSlug] || null,
//         }));
        
//         if (trailObj.sponsoredStops) {
//           trailObj.sponsoredStops = trailObj.sponsoredStops.map(stop => ({
//             ...stop,
//             place: placeMap[stop.placeSlug] || null,
//           }));
//         }
        
//         return trailObj;
//       })
//     );
    
//     res.json({ success: true, trails: populatedTrails });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get trail by ID with populated place data
// export const getTrailById = async (req, res) => {
//   try {
//     const trail = await Trail.findById(req.params.id);
//     if (!trail) {
//       return res.status(404).json({ success: false, message: "Trail not found" });
//     }
    
//     // Populate place data
//     const trailObj = trail.toObject();
//     const placeSlugs = [...new Set(trailObj.stops.map(stop => stop.placeSlug))];
//     const sponsoredSlugs = trailObj.sponsoredStops?.map(s => s.placeSlug) || [];
//     const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
    
//     const places = await Place.find({ slug: { $in: allSlugs } });
//     const placeMap = {};
//     places.forEach(place => {
//       placeMap[place.slug] = place;
//     });
    
//     trailObj.stops = trailObj.stops.map(stop => ({
//       ...stop,
//       place: placeMap[stop.placeSlug] || null,
//     }));
    
//     if (trailObj.sponsoredStops) {
//       trailObj.sponsoredStops = trailObj.sponsoredStops.map(stop => ({
//         ...stop,
//         place: placeMap[stop.placeSlug] || null,
//       }));
//     }
    
//     res.json({ success: true, trail: trailObj });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get trail by slug
// export const getTrailBySlug = async (req, res) => {
//   try {
//     const trail = await Trail.findOne({ slug: req.params.slug });
//     if (!trail) {
//       return res.status(404).json({ success: false, message: "Trail not found" });
//     }
    
//     // Populate place data
//     const trailObj = trail.toObject();
//     const placeSlugs = [...new Set(trailObj.stops.map(stop => stop.placeSlug))];
//     const sponsoredSlugs = trailObj.sponsoredStops?.map(s => s.placeSlug) || [];
//     const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
    
//     const places = await Place.find({ slug: { $in: allSlugs } });
//     const placeMap = {};
//     places.forEach(place => {
//       placeMap[place.slug] = place;
//     });
    
//     trailObj.stops = trailObj.stops.map(stop => ({
//       ...stop,
//       place: placeMap[stop.placeSlug] || null,
//     }));
    
//     if (trailObj.sponsoredStops) {
//       trailObj.sponsoredStops = trailObj.sponsoredStops.map(stop => ({
//         ...stop,
//         place: placeMap[stop.placeSlug] || null,
//       }));
//     }
    
//     res.json({ success: true, trail: trailObj });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Search trails
// export const searchTrails = async (req, res) => {
//   try {
//     const { q, category } = req.query;
//     const filter = { isActive: true };
    
//     if (q) {
//       filter.$or = [
//         { name: { $regex: q, $options: 'i' } },
//         { description: { $regex: q, $options: 'i' } },
//         { tags: { $in: [new RegExp(q, 'i')] } },
//       ];
//     }
//     if (category) filter.category = category;
    
//     const trails = await Trail.find(filter).sort({ name: 1 });
//     res.json({ success: true, trails });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Create trail
// export const createTrail = async (req, res) => {
//   try {
//     const trail = new Trail(req.body);
//     await trail.save();
//     res.status(201).json({ success: true, trail });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // Seed sample trails
// export const seedTrails = async (req, res) => {
//   try {
//     const existingCount = await Trail.countDocuments();
//     if (existingCount > 0) {
//       return res.json({ success: true, message: "Trails already exist", count: existingCount });
//     }

//     const sampleTrails = [
//       {
//         name: "Wood Carving Trail",
//         slug: "wood-carving",
//         description: "Explore traditional Newari woodcarving from ancient masterpieces to hands-on workshops.",
//         category: "woodcarving",
//         difficulty: "easy",
//         duration: "3-4 hours",
//         distance: "1.5 km",
//         color: "#8B4513",
//         icon: "🪵",
//         stops: [
//           { order: 1, placeSlug: "bhaktapur-durbar-square", duration: "30 min", note: "Admire wooden carvings", isWorkshop: false },
//           { order: 2, placeSlug: "peacock-window", duration: "20 min", note: "Famous masterpiece", isWorkshop: false },
//           { order: 3, placeSlug: "suwal-woodcarving", duration: "2 hours", note: "Hands-on class", isWorkshop: true },
//         ],
//         sponsoredStops: [
//           { afterStop: 2, placeSlug: "cafe-nyatapola", note: "Lunch break" },
//         ],
//         tags: ["woodcarving", "craft", "workshop"],
//       },
//       {
//         name: "Temple Heritage Walk",
//         slug: "temple-heritage",
//         description: "Discover the ancient temples and religious sites of Bhaktapur.",
//         category: "heritage",
//         difficulty: "easy",
//         duration: "2-3 hours",
//         distance: "2 km",
//         color: "#C41E3A",
//         icon: "🛕",
//         stops: [
//           { order: 1, placeSlug: "bhaktapur-durbar-square", duration: "45 min", note: "Start at the royal palace", isWorkshop: false },
//           { order: 2, placeSlug: "nyatapola-temple", duration: "30 min", note: "Nepal's tallest temple", isWorkshop: false },
//           { order: 3, placeSlug: "pottery-square", duration: "45 min", note: "Traditional pottery making", isWorkshop: false },
//         ],
//         tags: ["temple", "heritage", "culture"],
//       },
//       {
//         name: "Artisan Discovery",
//         slug: "artisan-discovery",
//         description: "Meet local artisans and learn traditional crafts of Bhaktapur.",
//         category: "craft",
//         difficulty: "moderate",
//         duration: "4-5 hours",
//         distance: "3 km",
//         color: "#DAA520",
//         icon: "🎨",
//         stops: [
//           { order: 1, placeSlug: "pottery-square", duration: "1 hour", note: "Try pottery making", isWorkshop: true },
//           { order: 2, placeSlug: "peacock-window", duration: "20 min", note: "Woodcarving art", isWorkshop: false },
//           { order: 3, placeSlug: "suwal-woodcarving", duration: "2 hours", note: "Carving workshop", isWorkshop: true },
//         ],
//         sponsoredStops: [
//           { afterStop: 1, placeSlug: "cafe-nyatapola", note: "Coffee break" },
//         ],
//         tags: ["craft", "workshop", "artisan"],
//       },
//     ];

//     await Trail.insertMany(sampleTrails);
//     res.json({ success: true, message: "Sample trails created", count: sampleTrails.length });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get suggested routes (both trails and places for homepage)
// export const getSuggestedRoutes = async (req, res) => {
//   try {
//     // Get active trails
//     const trails = await Trail.find({ isActive: true }).limit(5);
    
//     // Get all unique place slugs from trails
//     const allPlaceSlugs = [];
//     trails.forEach(trail => {
//       trail.stops.forEach(stop => allPlaceSlugs.push(stop.placeSlug));
//     });
    
//     // Get featured places (not in trails or sponsored)
//     const featuredPlaces = await Place.find({
//       $or: [
//         { isSponsored: true },
//         { slug: { $nin: allPlaceSlugs } },
//       ],
//     }).limit(5);
    
//     // Populate trail stops with place coordinates
//     const populatedTrails = await Promise.all(
//       trails.map(async (trail) => {
//         const trailObj = trail.toObject();
//         const placeSlugs = trailObj.stops.map(stop => stop.placeSlug);
//         const places = await Place.find({ slug: { $in: placeSlugs } });
//         const placeMap = {};
//         places.forEach(place => {
//           placeMap[place.slug] = place;
//         });
        
//         trailObj.stops = trailObj.stops.map(stop => ({
//           ...stop,
//           place: placeMap[stop.placeSlug] || null,
//         }));
        
//         // Get first place image as cover
//         const firstPlace = placeMap[trailObj.stops[0]?.placeSlug];
//         trailObj.coverImage = firstPlace?.imageUrl || null;
        
//         return {
//           type: 'trail',
//           ...trailObj,
//         };
//       })
//     );
    
//     // Format places as route destinations
//     const placeRoutes = featuredPlaces.map(place => ({
//       type: 'place',
//       _id: place._id,
//       name: place.name,
//       slug: place.slug,
//       description: place.description,
//       category: place.category,
//       coverImage: place.imageUrl,
//       coordinates: place.coordinates,
//       tags: place.tags,
//     }));
    
//     res.json({
//       success: true,
//       suggested: [...populatedTrails, ...placeRoutes],
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
