import Roadmap from "../models/Roadmap.js";
import Place from "../models/Place.js";

// Get all roadmaps with populated place data
export const getAllRoadmaps = async (req, res) => {
  try {
    const { category, difficulty, isActive } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const roadmaps = await Roadmap.find(filter).sort({ name: 1 });
    
    // Populate place data for each stop
    const populatedRoadmaps = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const roadmapObj = roadmap.toObject();
        
        // Get all unique place slugs from stops
        const placeSlugs = [...new Set(roadmapObj.stops.map(stop => stop.placeSlug))];
        const sponsoredSlugs = roadmapObj.sponsoredStops?.map(s => s.placeSlug) || [];
        const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
        
        // Fetch places
        const places = await Place.find({ slug: { $in: allSlugs } });
        const placeMap = {};
        places.forEach(place => {
          placeMap[place.slug] = place;
        });
        
        // Attach place data to stops
        roadmapObj.stops = roadmapObj.stops.map(stop => ({
          ...stop,
          place: placeMap[stop.placeSlug] || null,
        }));
        
        if (roadmapObj.sponsoredStops) {
          roadmapObj.sponsoredStops = roadmapObj.sponsoredStops.map(stop => ({
            ...stop,
            place: placeMap[stop.placeSlug] || null,
          }));
        }
        
        return roadmapObj;
      })
    );
    
    res.json({ success: true, roadmaps: populatedRoadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get roadmap by ID with populated place data
export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }
    
    // Populate place data
    const roadmapObj = roadmap.toObject();
    const placeSlugs = [...new Set(roadmapObj.stops.map(stop => stop.placeSlug))];
    const sponsoredSlugs = roadmapObj.sponsoredStops?.map(s => s.placeSlug) || [];
    const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
    
    const places = await Place.find({ slug: { $in: allSlugs } });
    const placeMap = {};
    places.forEach(place => {
      placeMap[place.slug] = place;
    });
    
    roadmapObj.stops = roadmapObj.stops.map(stop => ({
      ...stop,
      place: placeMap[stop.placeSlug] || null,
    }));
    
    if (roadmapObj.sponsoredStops) {
      roadmapObj.sponsoredStops = roadmapObj.sponsoredStops.map(stop => ({
        ...stop,
        place: placeMap[stop.placeSlug] || null,
      }));
    }
    
    res.json({ success: true, roadmap: roadmapObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get roadmap by slug
export const getRoadmapBySlug = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ slug: req.params.slug });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }
    
    // Populate place data
    const roadmapObj = roadmap.toObject();
    const placeSlugs = [...new Set(roadmapObj.stops.map(stop => stop.placeSlug))];
    const sponsoredSlugs = roadmapObj.sponsoredStops?.map(s => s.placeSlug) || [];
    const allSlugs = [...new Set([...placeSlugs, ...sponsoredSlugs])];
    
    const places = await Place.find({ slug: { $in: allSlugs } });
    const placeMap = {};
    places.forEach(place => {
      placeMap[place.slug] = place;
    });
    
    roadmapObj.stops = roadmapObj.stops.map(stop => ({
      ...stop,
      place: placeMap[stop.placeSlug] || null,
    }));
    
    if (roadmapObj.sponsoredStops) {
      roadmapObj.sponsoredStops = roadmapObj.sponsoredStops.map(stop => ({
        ...stop,
        place: placeMap[stop.placeSlug] || null,
      }));
    }
    
    res.json({ success: true, roadmap: roadmapObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search roadmaps
export const searchRoadmaps = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = { isActive: true };
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    
    const roadmaps = await Roadmap.find(filter).sort({ name: 1 });
    res.json({ success: true, roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create roadmap
export const createRoadmap = async (req, res) => {
  try {
    const roadmap = new Roadmap(req.body);
    await roadmap.save();
    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get suggested roadmaps (for homepage) - only roadmaps, no places
export const getSuggestedRoadmaps = async (req, res) => {
  try {
    // Get active roadmaps
    const roadmaps = await Roadmap.find({ isActive: true }).limit(10);
    
    // Populate roadmap stops with place coordinates
    const populatedRoadmaps = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const roadmapObj = roadmap.toObject();
        const placeSlugs = roadmapObj.stops.map(stop => stop.placeSlug);
        const places = await Place.find({ slug: { $in: placeSlugs } });
        const placeMap = {};
        places.forEach(place => {
          placeMap[place.slug] = place;
        });
        
        roadmapObj.stops = roadmapObj.stops.map(stop => ({
          ...stop,
          place: placeMap[stop.placeSlug] || null,
        }));
        
        // Get first place image as cover
        const firstPlace = placeMap[roadmapObj.stops[0]?.placeSlug];
        roadmapObj.coverImage = firstPlace?.imageUrl || null;
        
        return {
          type: 'roadmap',
          ...roadmapObj,
        };
      })
    );
    
    res.json({
      success: true,
      suggested: populatedRoadmaps,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
