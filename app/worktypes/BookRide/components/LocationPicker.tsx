import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, Keyboard, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRide } from "../RideContext";
import useAddressSearch from "../hooks/useAddressSearch";
import { reverseGeocode } from "../utils/SearchAddress";
import axios from "axios";

export default function LocationPicker() {
  const { pickup, drop, setPickup, setDrop, setStep, currentLocation, distance, eta, setFare } = useRide();
  const [active, setActive] = useState(null); // "pickup" | "drop"
  const { query, setQuery, results, loading, clearResults } = useAddressSearch();
  
  
  // Get address for current location when component mounts
  useEffect(() => {
    const setCurrentLocationAddress = async () => {
      if (currentLocation && !pickup?.humanAddress) {
        try {
          const address = await reverseGeocode(currentLocation.lat, currentLocation.lng);
          if (address) {
            setPickup({
              ...currentLocation,
              humanAddress: address,
            });
          }
        } catch (error) {
          console.log("Error getting address for current location:", error);
        }
      }
    };

    setCurrentLocationAddress();
  }, [currentLocation]);

  const handleSelect = async (item) => {
    const selected = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      humanAddress: item,
    };

    if (active === "pickup") {
      setPickup(selected);
    } else if (active === "drop") {
      setDrop(selected);
    }

    setQuery("");
    setActive(null);
    clearResults();
    Keyboard.dismiss();
  };

  const handleInputFocus = (type: "pickup" | "drop") => {
    setActive(type);
    // Set current value as query for editing
    const currentValue = type === "pickup" 
      ? pickup?.humanAddress?.display_name 
      : drop?.humanAddress?.display_name;
    setQuery(currentValue || "");
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    // If user clears the input, clear the location
    if (text === "") {
      if (active === "pickup") {
        setPickup(null);
      } else if (active === "drop") {
        setDrop(null);
      }
    }
  };

  const handleBlur = () => {
    // Small delay to allow for selection
    setTimeout(() => {
      setActive(null);
      clearResults();
    }, 200);
  };

  // GETTING REAL FARE from backend
  const BASE_URL = "http://localhost:5000/api/fare";
  const DEMO_FARE = {
    bike: 45,
    auto: 60,
    sedan: 120,
    suv: 180,
  };
  
  const handleContinue = async () => {
    if (!pickup || !drop) {
      return Alert.alert("Enter both pickup and drop locations");
    }
  
    try {
      // Try connecting to backend
      const { data } = await axios.post(`${BASE_URL}/calc`, { distance, eta, });
  
      // Save real fares
      setFare(data.fare);
      setStep(2);
  
    } catch (error) {
      console.warn("Backend offline, using demo fare");
  
      // Only show this when server is down
      Alert.alert(
        "Demo Mode",
        "Backend server is offline. Showing demo prices."
      );
      // Use demo fallback
      setFare(DEMO_FARE);
      // Still move to step 2
      setStep(2);
    }
  };


  return (
    <View className="absolute w-full px-4 mt-3 top-10 z-10">
   
      <View className="bg-white rounded-2xl p-4">
      
        {/* Pickup Input */}
        <View className="mb-2">
          <View className="flex flex-row items-center gap-1 mb-2">
            <Ionicons name="location" size={12} color="green" />
            <Text className="text-gray-500 leading-none">Pickup</Text>
          </View>
          
          <TextInput
            placeholder="Enter Pickup Location"
            value={
              active === "pickup"
                ? query
                : pickup?.humanAddress?.display_name || "Getting your location..."
            }
            onFocus={() => handleInputFocus("pickup")}
            onBlur={handleBlur}
            onChangeText={handleInputChange}
            className="bg-white rounded-xl p-3 border border-gray-200"
            placeholderTextColor="#9ca3af"
          />
        </View>
  
        {/* Drop Input */}
        <View className="mb-2">
          <View className="flex flex-row items-center gap-1 mb-2">
            <Ionicons name="location" size={12} color="red" />
            <Text className="text-gray-500 leading-none">Drop</Text>
          </View>
          <TextInput
            placeholder="Enter Destination"
            value={
              active === "drop"
                ? query
                : drop?.humanAddress?.display_name || ""
            }
            onFocus={() => handleInputFocus("drop")}
            onBlur={handleBlur}
            onChangeText={handleInputChange}
            className="bg-white rounded-xl p-3 border border-gray-200"
            placeholderTextColor="#9ca3af"
          />
        </View>
  
        {/* Loading Indicator */}
        {loading && (
          <View className="bg-white rounded-xl p-3 mt-2">
            <Text className="text-gray-600">Searching...</Text>
          </View>
        )}
  
        {/* Suggestions Box */}
        {results.length > 0 && active && (
          <View className="bg-white rounded-xl shadow-lg border border-gray-200 my-2">
            {results.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(item)}
                className="py-3 px-4 border-b border-gray-100 last:border-b-0"
              >
                <Text className="text-black font-semibold text-base">
                  {item.display_name}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {[
                    item.address?.road,
                    item.address?.suburb,
                    item.address?.city || item.address?.town || item.address?.village,
                    item.address?.state,
                    item.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <TouchableOpacity className={`${(pickup && drop) ? "bg-green-700 border-green-700" : "bg-gray-300 border-gray-300"}  rounded-xl p-3 mt-2 border `} 
         onPress={handleContinue}
        >
          <Text className="text-white text-center">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}




        