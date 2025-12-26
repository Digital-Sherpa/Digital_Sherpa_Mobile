import Roadmap from "../models/Roadmap.js";
import Place from "../models/Place.js";
import Event from "../models/Event.js";

// AI Search using Gemini Flash
export const aiSearch = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: "Search query is required" 
      });
    }

    // Check for Gemini API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: "Gemini API key not configured" 
      });
    }

    // Fetch all data from database
    const [roadmaps, places, events] = await Promise.all([
      Roadmap.find({ isActive: true }),
      Place.find({}),
      Event.find({ isActive: true })
    ]);

    // Build context for Gemini
    const roadmapContext = roadmaps.map(r => ({
      id: r._id.toString(),
      name: r.name,
      category: r.category,
      description: r.description,
      difficulty: r.difficulty,
      duration: r.duration,
      tags: r.tags
    }));

    const eventContext = events.map(e => ({
      id: e._id.toString(),
      name: e.name,
      category: e.category,
      description: e.description,
      date: e.startDate
    }));

    // Create prompt for Gemini
    const prompt = `You are a search assistant for Digital Sherpa, a heritage tourism app in Nepal.
Given a user's natural language query, analyze the available roadmaps and events and return the IDs of items that best match the user's intent.

Available Roadmaps:
${JSON.stringify(roadmapContext, null, 2)}

Available Events:
${JSON.stringify(eventContext, null, 2)}

User Query: "${query}"

Instructions:
- Understand the user's intent (what they want to explore, difficulty preference, category interest, etc.)
- Match roadmaps based on name, category, description, difficulty, duration, or tags
- Match events based on name, category, description, or date
- Return ALL matching items, not just the best one
- If no exact matches, return items that are semantically related
- If the query is very generic, return relevant popular options

Return ONLY valid JSON in this exact format, no markdown or extra text:
{"roadmapIds": ["id1", "id2"], "eventIds": ["id1"]}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", JSON.stringify(errorData, null, 2));
      return res.status(500).json({ 
        success: false, 
        message: `AI service error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData.error
      });
    }

    const geminiData = await geminiResponse.json();
    
    // Extract text response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse JSON from response (handle potential markdown code blocks)
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      parsedResponse = { roadmapIds: [], eventIds: [] };
    }

    const { roadmapIds = [], eventIds = [] } = parsedResponse;

    // Fetch matched roadmaps with populated data
    const matchedRoadmaps = await Promise.all(
      roadmaps
        .filter(r => roadmapIds.includes(r._id.toString()))
        .map(async (roadmap) => {
          const roadmapObj = roadmap.toObject();
          
          // Get place data for stops
          const placeSlugs = roadmapObj.stops.map(stop => stop.placeSlug);
          const stopPlaces = await Place.find({ slug: { $in: placeSlugs } });
          const placeMap = {};
          stopPlaces.forEach(place => {
            placeMap[place.slug] = place;
          });
          
          roadmapObj.stops = roadmapObj.stops.map(stop => ({
            ...stop,
            place: placeMap[stop.placeSlug] || null,
          }));
          
          // Get cover image from first place
          const firstPlace = placeMap[roadmapObj.stops[0]?.placeSlug];
          roadmapObj.coverImage = firstPlace?.imageUrl || null;
          
          return {
            type: 'roadmap',
            ...roadmapObj,
          };
        })
    );

    // Fetch matched events
    const matchedEvents = events.filter(e => 
      eventIds.includes(e._id.toString())
    );

    res.json({
      success: true,
      suggested: matchedRoadmaps,
      events: matchedEvents,
      query: query,
      aiProcessed: true
    });

  } catch (error) {
    console.error("AI Search error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
