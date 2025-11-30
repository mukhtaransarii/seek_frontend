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