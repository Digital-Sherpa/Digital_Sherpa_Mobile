// API configuration and service
const API_BASE_URL = 'http://192.168.10.5:3000'; // Your machine's IP
// Use 'http://10.0.2.2:3000' for Android emulator
// Use 'http://localhost:3000' for iOS simulator

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

// Route types
export interface RouteStop {
  _id?: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  order: number;
}

export interface Route {
  _id: string;
  name: string;
  description: string;
  category: 'cultural' | 'adventure' | 'food' | 'religious' | 'nature';
  duration: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  stops: RouteStop[];
  coverImage?: string;
  isActive: boolean;
}

// Place types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EntryFee {
  nepali: number;
  saarc: number;
  foreign: number;
}

export interface Place {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  coordinates: Coordinates;
  imageUrl?: string;
  gallery?: string[];
  videoUrl?: string;
  address?: string;
  openingHours?: string;
  entryFee?: EntryFee;
  tags: string[];
  hasWorkshop: boolean;
  isSponsored: boolean;
}

// Trail types (now called Roadmap)
export interface RoadmapStop {
  _id?: string;
  order: number;
  placeSlug: string;
  duration?: string;
  note?: string;
  isWorkshop?: boolean;
  place?: Place; // Populated from server
}

export interface SponsoredStop {
  afterStop: number;
  placeSlug: string;
  note?: string;
  place?: Place;
}

export interface Roadmap {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  duration?: string;
  distance?: string;
  color?: string;
  icon?: string;
  stops: RoadmapStop[];
  sponsoredStops?: SponsoredStop[];
  tags: string[];
  isActive: boolean;
  coverImage?: string;
}

// Alias for backward compatibility
export type Trail = Roadmap;
export type TrailStop = RoadmapStop;

// Suggested route (only roadmaps now)
export interface SuggestedRoute {
  type: 'roadmap';
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  coverImage?: string;
  coordinates?: Coordinates;
  stops?: RoadmapStop[];
  duration?: string;
  distance?: string;
  difficulty?: string;
  tags?: string[];
}

// Event types
export interface EventLocation {
  _id?: string;
  name: string;
  slug?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  note?: string;
}

export interface Event {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurringPattern?: string;
  locations?: EventLocation[];
  imageUrl?: string;
  gallery?: string[];
  videoUrl?: string;
  entryFee?: {
    isFree?: boolean;
    price?: number;
    note?: string;
  };
  organizer?: string;
  contactInfo?: string;
  website?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RoutesResponse {
  routes: Route[];
}

interface RouteDetailResponse {
  route: Route;
}

interface PlacesResponse {
  success: boolean;
  places: Place[];
}

interface PlaceDetailResponse {
  success: boolean;
  place: Place;
}

interface RoadmapsResponse {
  success: boolean;
  roadmaps: Roadmap[];
}

interface RoadmapDetailResponse {
  success: boolean;
  roadmap: Roadmap;
}

// Aliases for backward compatibility
type TrailsResponse = RoadmapsResponse;
type TrailDetailResponse = RoadmapDetailResponse;

interface SuggestedResponse {
  success: boolean;
  suggested: SuggestedRoute[];
}

interface EventsResponse {
  success: boolean;
  events: Event[];
}

interface ApiError {
  message: string;
}

export const api = {
  // Event APIs
  getFeaturedEvents: async (): Promise<EventsResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/events/featured`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch featured events');
      }

      return result as EventsResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Registration failed');
      }

      return result as AuthResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Login failed');
      }

      return result as AuthResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  // Route APIs
  getRoutes: async (): Promise<RoutesResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch routes');
      }

      return result as RoutesResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  getRouteById: async (id: string): Promise<RouteDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch route');
      }

      return result as RouteDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  searchRoutes: async (query?: string, category?: string): Promise<RoutesResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE_URL}/routes/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to search routes');
      }

      return result as RoutesResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  seedRoutes: async (): Promise<{ message: string; count: number }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/routes/seed`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to seed routes');
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  },

  // Place APIs
  getPlaces: async (category?: string): Promise<PlacesResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE_URL}/places?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch places');
      }

      return result as PlacesResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  getPlaceBySlug: async (slug: string): Promise<PlaceDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/places/slug/${slug}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch place');
      }

      return result as PlaceDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  searchPlaces: async (query?: string, category?: string): Promise<PlacesResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE_URL}/places/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to search places');
      }

      return result as PlacesResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  // Roadmap APIs (was Trail APIs)
  getRoadmaps: async (category?: string): Promise<RoadmapsResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE_URL}/roadmaps?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmaps');
      }

      // Map response for backward compatibility
      return { success: result.success, roadmaps: result.roadmaps } as RoadmapsResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  // Alias for backward compatibility
  getTrails: async (category?: string): Promise<TrailsResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE_URL}/roadmaps?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmaps');
      }

      // Return as trails for backward compatibility
      return { success: result.success, trails: result.roadmaps } as unknown as TrailsResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  getRoadmapById: async (id: string): Promise<RoadmapDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmaps/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmap');
      }

      return result as RoadmapDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  getTrailById: async (id: string): Promise<TrailDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmaps/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmap');
      }

      // Return as trail for backward compatibility
      return { success: result.success, trail: result.roadmap } as unknown as TrailDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  getRoadmapBySlug: async (slug: string): Promise<RoadmapDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmaps/slug/${slug}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmap');
      }

      return result as RoadmapDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  getTrailBySlug: async (slug: string): Promise<TrailDetailResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmaps/slug/${slug}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch roadmap');
      }

      // Return as trail for backward compatibility
      return { success: result.success, trail: result.roadmap } as unknown as TrailDetailResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  // Suggested routes (for homepage)
  getSuggestedRoutes: async (): Promise<SuggestedResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/suggested`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to fetch suggested routes');
      }

      return result as SuggestedResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },

  // Seed all data
  seedAll: async (): Promise<{ success: boolean; message: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/seed-all`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ApiError).message || 'Failed to seed data');
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw error;
    }
  },
};
