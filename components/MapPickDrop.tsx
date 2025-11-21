import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { enhancedSearchLocation } from "../api";
import { debounce } from "lodash";

export default function MapPickDrop({ 
  onLocationsSelected,
  needsPickup = true,
  needsDrop = true,
  initialTitle = "Select Locations"
}) {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const mapRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, type) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const results = await enhancedSearchLocation(query);
        setSearchResults(results);
      } catch (error) {
        console.log("Search failed silently");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPickupLocation({ latitude: 28.6139, longitude: 77.2090 });
        setPickupAddress("New Delhi, India");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      
      setPickupLocation(currentLoc);
      await reverseGeocodeLocation(currentLoc, 'pickup');
    } catch (err) {
      setPickupLocation({ latitude: 28.6139, longitude: 77.2090 });
      setPickupAddress("New Delhi, India");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocodeLocation = async (location, type) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync(location);
      if (reverseGeocode[0]) {
        const address = formatAddress(reverseGeocode[0]);
        if (type === 'pickup') {
          setPickupAddress(address);
        } else {
          setDropAddress(address);
        }
      }
    } catch (error) {
      console.log("Reverse geocode failed");
    }
  };

  const formatAddress = (address) => {
    if (!address) return "Unknown Location";
    
    const parts = [];
    if (address.name && address.name !== address.city) parts.push(address.name);
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    
    return parts.length > 0 ? parts.join(", ") : "Unknown Location";
  };

  const handleSearch = (query, type) => {
    if (type === 'pickup') {
      setPickupAddress(query);
    } else {
      setDropAddress(query);
    }
    
    debouncedSearch(query, type);
  };

  const selectLocationFromSearch = async (result, type) => {
    const location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    const displayName = result.display_name || formatSearchResult(result);

    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupAddress(displayName);
    } else {
      setDropLocation(location);
      setDropAddress(displayName);
    }

    setSearchResults([]);
    setActiveInput(null);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }

    // Notify parent when both locations are selected
    if (needsPickup && needsDrop && pickupLocation && dropLocation) {
      onLocationsSelected({
        pickup: { location: pickupLocation, address: pickupAddress },
        drop: { location: dropLocation, address: dropAddress }
      });
    } else if (needsPickup && !needsDrop && pickupLocation) {
      onLocationsSelected({
        pickup: { location: pickupLocation, address: pickupAddress }
      });
    } else if (!needsPickup && needsDrop && dropLocation) {
      onLocationsSelected({
        drop: { location: dropLocation, address: dropAddress }
      });
    }
  };

  const formatSearchResult = (result) => {
    const address = result.address;
    if (!address) return result.display_name;

    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    
    return parts.length > 0 ? parts.join(", ") : result.display_name;
  };

  const handleMapPress = (e) => {
    if (activeInput) {
      const location = e.nativeEvent.coordinate;
      if (activeInput === 'pickup') {
        setPickupLocation(location);
        reverseGeocodeLocation(location, 'pickup');
      } else {
        setDropLocation(location);
        reverseGeocodeLocation(location, 'drop');
      }
      setActiveInput(null);
    }
  };

  const handleContinue = () => {
    if ((needsPickup && !pickupLocation) || (needsDrop && !dropLocation)) {
      alert("Please select all required locations");
      return;
    }

    onLocationsSelected({
      ...(needsPickup && { pickup: { location: pickupLocation, address: pickupAddress } }),
      ...(needsDrop && { drop: { location: dropLocation, address: dropAddress } })
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-2 text-gray-600">Getting your location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 28.6139,
            longitude: 77.2090,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          region={
            pickupLocation ? {
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : {
              latitude: 28.6139,
              longitude: 77.2090,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }
          }
          onPress={handleMapPress}
          showsUserLocation={true}
        >
          {/* Pickup Marker */}
          {pickupLocation && needsPickup && (
            <Marker coordinate={pickupLocation}>
              <View className="w-10 h-10 bg-green-500 rounded-full justify-center items-center border-2 border-white">
                <Ionicons name="location" size={16} color="white" />
              </View>
            </Marker>
          )}

          {/* Drop Marker */}
          {dropLocation && needsDrop && (
            <Marker coordinate={dropLocation}>
              <View className="w-10 h-10 bg-red-500 rounded-full justify-center items-center border-2 border-white">
                <Ionicons name="flag" size={16} color="white" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Location Inputs Panel */}
      <View className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-200 max-h-1/2">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-lg font-bold text-gray-900 mb-3 text-center">{initialTitle}</Text>
          
          {/* Pickup Input */}
          {needsPickup && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 bg-green-500 rounded-full justify-center items-center mr-2">
                  <Ionicons name="location" size={12} color="white" />
                </View>
                <Text className="text-gray-700 font-semibold">Pickup Location</Text>
              </View>
              <TextInput
                value={pickupAddress}
                onChangeText={(text) => handleSearch(text, 'pickup')}
                onFocus={() => setActiveInput('pickup')}
                placeholder="Start typing location..."
                className="border border-gray-300 rounded-xl p-3 text-gray-700 bg-gray-50"
              />
            </View>
          )}

          {/* Drop Input */}
          {needsDrop && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 bg-red-500 rounded-full justify-center items-center mr-2">
                  <Ionicons name="flag" size={12} color="white" />
                </View>
                <Text className="text-gray-700 font-semibold">Drop Location</Text>
              </View>
              <TextInput
                value={dropAddress}
                onChangeText={(text) => handleSearch(text, 'drop')}
                onFocus={() => setActiveInput('drop')}
                placeholder="Start typing location..."
                className="border border-gray-300 rounded-xl p-3 text-gray-700 bg-gray-50"
              />
            </View>
          )}

          {/* Search Results */}
          {activeInput && (
            <View className="mb-4 bg-white border border-gray-200 rounded-xl max-h-40">
              <View className="flex-row justify-between items-center p-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">
                  {searchLoading ? "Searching..." : "Suggestions"}
                </Text>
                <TouchableOpacity onPress={() => setActiveInput(null)}>
                  <Ionicons name="close" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {searchLoading ? (
                <View className="p-4 items-center">
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : searchResults.length > 0 ? (
                <ScrollView>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => selectLocationFromSearch(result, activeInput)}
                      className="p-3 border-b border-gray-100 active:bg-gray-50"
                    >
                      <Text className="text-gray-700 font-medium" numberOfLines={2}>
                        {formatSearchResult(result)}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                        {result.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="p-4 items-center">
                  <Text className="text-gray-500 text-center text-sm">
                    {pickupAddress.length >= 2 || dropAddress.length >= 2 
                      ? "No results found" 
                      : "Type 2+ characters to search"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          {activeInput && (
            <View className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
              <Text className="text-blue-700 text-sm text-center">
                📍 Tap on map or select from suggestions
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={(needsPickup && !pickupLocation) || (needsDrop && !dropLocation)}
            className={`py-4 rounded-2xl ${
              ((needsPickup && !pickupLocation) || (needsDrop && !dropLocation)) ? "bg-gray-300" : "bg-green-500"
            }`}
          >
            <Text className="text-center text-white font-bold text-lg">
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}