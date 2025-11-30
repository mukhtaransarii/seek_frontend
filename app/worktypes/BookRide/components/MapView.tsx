import React, { useState, useRef, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import * as Location from "expo-location";
import { View, Text, ActivityIndicator } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useRide } from "../RideContext";
import usePolyline from "../hooks/usePolyline";

export default function MapViewComponents() {
  const { pickup, setPickup, drop, currentLocation, setCurrentLocation } = useRide();
  const { routeCoords } = usePolyline();
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Default location (Delhi) - Loads instantly
  const defaultLocation = { lat: 28.6139, lng: 77.2090 };

  // Get user's location in background - doesn't block map render
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });

        if (isMounted && location) {
          const newLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          
          setCurrentLocation(newLocation);
          if (!pickup) setPickup(newLocation);
          
          // Move map to user's location after load
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.lat,
              longitude: newLocation.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 1000);
          }
        }
      } catch (err) {
        console.log("Location error:", err);
        if (isMounted) {
          setCurrentLocation(defaultLocation);
          if (!pickup) setPickup(defaultLocation);
        }
      }
    })();

    return () => { isMounted = false };
  }, []);

  // Fit map to markers
  useEffect(() => {
    if (mapRef.current && mapReady && (pickup || drop)) {
      const coordinates = [];
      
      if (pickup) coordinates.push({
        latitude: pickup.lat,
        longitude: pickup.lng,
      });
      
      if (drop) coordinates.push({
        latitude: drop.lat,
        longitude: drop.lng,
      });
      
      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [pickup, drop, mapReady]);

  // 🚀 MAP LOADS INSTANTLY NOW - No waiting for location
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_DEFAULT}
      // Fixed initial region - loads immediately
      initialRegion={{
        latitude: defaultLocation.lat,
        longitude: defaultLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onMapReady={() => setMapReady(true)}
      showsUserLocation={true}  // Built-in blue dot
      showsMyLocationButton={true}
      loadingEnabled={true}     // Better loading handling
    >
      {/* Pickup Marker */}
      {pickup && (
        <Marker
          coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
          title="Pickup Location"
          pinColor="green"
        >
         <Ionicons name="location" size={28} color="green" />
        </Marker>
      )}

      {/* Drop Marker */}
      {drop && (
        <Marker
          coordinate={{ latitude: drop.lat, longitude: drop.lng }}
          title="Drop Location"
        >
         <Ionicons name="location" size={28} color="red" />
        </Marker>
      )}

      {/* Route Line */}
      {routeCoords.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeWidth={4}
          strokeColor="#3b82f6"
        />
      )}
    </MapView>
  );
}