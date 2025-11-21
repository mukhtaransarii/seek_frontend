import React, { useState, useEffect } from "react";
import { View, Dimensions, Image } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { getRoute } from "../api";
import polyline from "@mapbox/polyline";

const { width, height } = Dimensions.get('window');

export default function MapTrip({ 
  allyCurrentLocation = null,
  pickupLocation = null,
  dropLocation = null,
  seekCurrentLocation = true,
  showRoutes = true,
  allyImage = null,
  onMapReady = () => {}
}) {
  const [routes, setRoutes] = useState({ allyToPickup: [], pickupToDrop: [] });

  // Calculate routes when locations change
  useEffect(() => {
    if (showRoutes && allyCurrentLocation && pickupLocation && dropLocation) {
      calculateRoutes();
    }
    onMapReady();
  }, [allyCurrentLocation, pickupLocation, dropLocation]);

  const calculateRoutes = async () => {
    try {
      // Ally → Pickup route
      if (allyCurrentLocation && pickupLocation) {
        const allyToPickupData = await getRoute(
          allyCurrentLocation.longitude, allyCurrentLocation.latitude,
          pickupLocation.longitude, pickupLocation.latitude
        );
        if (allyToPickupData?.routes?.length > 0) {
          const decoded = polyline.decode(allyToPickupData.routes[0].geometry);
          setRoutes(prev => ({ 
            ...prev, 
            allyToPickup: decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng })) 
          }));
        }
      }

      // Pickup → Drop route
      if (pickupLocation && dropLocation) {
        const pickupToDropData = await getRoute(
          pickupLocation.longitude, pickupLocation.latitude,
          dropLocation.longitude, dropLocation.latitude
        );
        if (pickupToDropData?.routes?.length > 0) {
          const decoded = polyline.decode(pickupToDropData.routes[0].geometry);
          setRoutes(prev => ({ 
            ...prev, 
            pickupToDrop: decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng })) 
          }));
        }
      }
    } catch (err) {
      console.error("Route calculation error:", err);
    }
  };

  const getMapRegion = () => {
    if (pickupLocation) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1 }}
      initialRegion={getMapRegion()}
      scrollEnabled={true}
      zoomEnabled={true}
      showsUserLocation={seekCurrentLocation}
    >
      {/* Ally Marker */}
      {allyCurrentLocation && (
        <Marker coordinate={allyCurrentLocation}>
          <View className="w-14 h-14 rounded-full border-4 border-white bg-blue-500 shadow-lg overflow-hidden justify-center items-center">
            {allyImage ? (
              <Image
                source={{ uri: allyImage }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={20} color="white" />
            )}
          </View>
        </Marker>
      )}

      {/* Pickup Marker */}
      {pickupLocation && (
        <Marker coordinate={pickupLocation}>
          <View className="w-12 h-12 bg-green-500 rounded-full justify-center items-center border-4 border-white shadow-lg">
            <Ionicons name="location" size={18} color="white" />
          </View>
        </Marker>
      )}

      {/* Drop Marker */}
      {dropLocation && (
        <Marker coordinate={dropLocation}>
          <View className="w-12 h-12 bg-red-500 rounded-full justify-center items-center border-4 border-white shadow-lg">
            <Ionicons name="flag" size={18} color="white" />
          </View>
        </Marker>
      )}

      {/* Routes */}
      {showRoutes && routes.allyToPickup.length > 0 && (
        <Polyline coordinates={routes.allyToPickup} strokeColor="#007AFF" strokeWidth={5} />
      )}
      {showRoutes && routes.pickupToDrop.length > 0 && (
        <Polyline coordinates={routes.pickupToDrop} strokeColor="#10B981" strokeWidth={5} />
      )}
    </MapView>
  );
}