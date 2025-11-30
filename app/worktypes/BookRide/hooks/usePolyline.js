import { useState, useEffect } from "react";
import polyline from "@mapbox/polyline";
import { useRide } from "../RideContext";
import { getRoute } from "../utils/getRoute";

export default function useRideMap() {
  const { pickup, drop, setDistance, setEta } = useRide();

  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format distance to "X.X km"
  const formatDistance = (distanceInKm) => {
    return `${parseFloat(distanceInKm).toFixed(1)}km`;
  };

  // Format ETA to "Xh Ym" or "Xm"
  const formatEta = (etaInMinutes, distanceKm = null) => {
    // Convert to numbers
    const baseMinutes = typeof etaInMinutes === 'string' ? parseInt(etaInMinutes) : etaInMinutes;
    const distance = typeof distanceKm === 'string' ? parseFloat(distanceKm) : distanceKm;
    
    let realisticMinutes = baseMinutes;
    
    // Apply traffic calculation if distance is available
    if (distance !== null && distance > 0) {
      if (distance <= 5) {
        realisticMinutes = Math.round(baseMinutes * 1.2);
      } else if (distance <= 15) {
        realisticMinutes = Math.round(baseMinutes * 1.5);
      } else {
        realisticMinutes = Math.round(baseMinutes * 2);
      }
      
      // Peak hours adjustment
      const hour = new Date().getHours();
      const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
      
      if (isPeakHour && distance > 5) {
        realisticMinutes = Math.round(realisticMinutes * 1.15);
      }
    }
    
    // Format the final ETA
    if (realisticMinutes >= 60) {
      const hours = Math.floor(realisticMinutes / 60);
      const minutes = realisticMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${realisticMinutes}m`;
  };
  

  // Fetch route whenever pickup & drop updated
  useEffect(() => {
    if (!pickup || !drop) return;

    const fetchRoute = async () => {
      try {
        setLoading(true);

        const data = await getRoute(
          pickup.lng,
          pickup.lat,
          drop.lng,
          drop.lat
        );

        if (!data || !data.routes || data.routes.length === 0) return;

        const route = data.routes[0];

        // Convert encoded polyline to array of coordinates
        const decoded = polyline.decode(route.geometry);

        const coords = decoded.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);

        // Store formatted distance + ETA in context
        const distanceInKm = (route.distance / 1000).toFixed(1);
        const etaInMinutes = Math.round(route.duration / 60);
        
        setDistance(formatDistance(distanceInKm)); // "25.7km"
        setEta(formatEta(etaInMinutes, distanceInKm)); // "1h 5m" or "45m"
        
      } catch (e) {
        console.log("OSRM route error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, drop]);

  return {
    loadingRoute: loading,
    routeCoords,
  };
}