export const alliesData = [
  {
    id: 1,
    name: "Raj Sharma",
    image: "https://randomuser.me/api/portraits/men/47.jpg",
    rating: 4.8,
    reviews: 247,
    workType: "Ride Service",
    vehicleType: "Car",
    vehicleNumber: "DL1AB1234",
    currentLocation: {
      latitude: 28.6139,
      longitude: 77.2090,
      address: "Connaught Place, Delhi"
    },
    baseFare: 50,
    perKmRate: 12,
    perMinuteRate: 2,
    available: true
  },
  // ... other allies
];

// OSRM API functions
export const getRoute = async (startLng, startLat, endLng, endLat) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("OSRM API Error:", error);
    throw error;
  }
};


// Geocoding API with proper headers
export const searchLocation = async (query) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YourAppName/1.0' // Required by Nominatim
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Geocoding API Error:", error);
    throw error;
  }
};

// Reverse Geocoding with proper headers
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YourAppName/1.0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Reverse Geocoding Error:", error);
    throw error;
  }
};

// Improved search with debouncing and better filtering
export const enhancedSearchLocation = async (query) => {
  if (query.length < 2) return [];
  
  try {
    const results = await searchLocation(query);
    
    // Filter results to show more relevant Indian locations first
    return results
      .filter(result => {
        // Prioritize results with proper address components
        const address = result.address;
        return address && (address.city || address.town || address.village || address.suburb);
      })
      .slice(0, 5); // Limit to 5 results
  } catch (error) {
    console.error("Enhanced search error:", error);
    return [];
  }
};

// Calculate fare based on distance and work type
export const calculateFare = (distanceKm, workType) => {
  const baseFares = {
    "Book Ride": 50,
    "Send Parcel": 30,
    "Home Services": 100,
    "Event Help": 200
  };

  const baseFare = baseFares[workType] || 50;
  const perKmRate = workType === "Send Parcel" ? 8 : 10;
  
  return Math.round(baseFare + (distanceKm * perKmRate));
};

export const calculateETA = (distanceKm) => {
  const timeMinutes = Math.round((distanceKm / 30) * 60);
  return timeMinutes > 60 
    ? `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m` 
    : `${timeMinutes} minutes`;
};


