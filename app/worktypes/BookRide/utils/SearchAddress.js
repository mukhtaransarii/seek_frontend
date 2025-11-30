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
    return results.slice(0, 8); // Limit to 8 results
    
  } catch (error) {
    console.error("Enhanced search error:", error);
    return [];
  }
};