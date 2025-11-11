import CustomHeader from '../components/CustomHeader';
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight } = Dimensions.get('window');

export default function TripBooking() {
  const { ally, selectedSkills, selectedAssets } = useLocalSearchParams();

  const parsedAlly = ally ? JSON.parse(ally) : null;
  const [selectedSkillsArr, setSelectedSkillsArr] = useState(
    selectedSkills ? JSON.parse(selectedSkills) : []
  );
  const [selectedAssetsArr, setSelectedAssetsArr] = useState(
    selectedAssets ? JSON.parse(selectedAssets) : []
  );

  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // NEW STATES
  const [tripFare, setTripFare] = useState(0);
  const [eta, setEta] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [myAssets, setMyAssets] = useState("");
  const [workLocation, setWorkLocation] = useState("current"); // "current" or "different"
  const [differentLocationAddress, setDifferentLocationAddress] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  
  // NEW STATES FOR LOCATION SELECTION
  const [selectedWorkLocation, setSelectedWorkLocation] = useState(null);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState(null);

  // Calculate trip fare
  const calculateTripFare = (distanceKm, skills, assets) => {
    const baseFare = 50;
    const perKmRate = 10;
    const skillPremium = skills.length * 20;
    const assetPremium = assets.length * 15;
    
    const total = baseFare + (distanceKm * perKmRate) + skillPremium + assetPremium;
    return Math.round(total);
  };

  // Calculate ETA
  const calculateETA = (distanceKm) => {
    const avgSpeed = 30;
    const timeHours = distanceKm / avgSpeed;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes > 60 
      ? `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m` 
      : `${timeMinutes} minutes`;
  };

  // Recalculate fare when selected work changes
  useEffect(() => {
    if (distance) {
      const calculatedFare = calculateTripFare(distance, selectedSkillsArr, selectedAssetsArr);
      setTripFare(calculatedFare);
    }
  }, [selectedSkillsArr, selectedAssetsArr, distance]);

  // Handle skill selection
  const handleSkillPress = (skill) => {
    if (selectedSkillsArr.includes(skill)) {
      // Remove skill if already selected
      setSelectedSkillsArr(selectedSkillsArr.filter(s => s !== skill));
    } else {
      // Add skill with confirmation
      Alert.alert(
        "Add Skill to Work",
        `Do you want to add "${skill}" to your selected work?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Add", 
            onPress: () => setSelectedSkillsArr([...selectedSkillsArr, skill])
          }
        ]
      );
    }
  };

  // Handle asset selection
  const handleAssetPress = (asset) => {
    if (selectedAssetsArr.includes(asset)) {
      // Remove asset if already selected
      setSelectedAssetsArr(selectedAssetsArr.filter(a => a !== asset));
    } else {
      // Add asset with confirmation
      Alert.alert(
        "Add Asset to Work",
        `Do you want to add "${asset}" to your selected work?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Add", 
            onPress: () => setSelectedAssetsArr([...selectedAssetsArr, asset])
          }
        ]
      );
    }
  };

  // Handle work location change
  const handleWorkLocationChange = (locationType) => {
    setWorkLocation(locationType);
    if (locationType === "different") {
      setShowLocationInput(true);
      // Auto-open map selection when choosing different location
      handleMapLocationSelect();
    } else {
      setShowLocationInput(false);
      setDifferentLocationAddress("");
      setSelectedWorkLocation(null);
      // Reset to current location
      updateRoute(location, parsedAlly);
    }
  };

  // Handle map location selection
  const handleMapLocationSelect = () => {
    setIsSelectingOnMap(true);
    setIsCollapsed(true); // Collapse bottom box to focus on map
  };

  // Confirm map location selection
  const confirmMapLocation = () => {
    if (tempMapLocation) {
      const selectedLocation = {
        latitude: tempMapLocation.latitude,
        longitude: tempMapLocation.longitude,
        address: "Selected location on map"
      };
      
      setSelectedWorkLocation(selectedLocation);
      setDifferentLocationAddress("Selected location on map");
      setIsSelectingOnMap(false);
      setIsCollapsed(false); // Expand bottom box again
      
      // Update route with selected location
      updateRoute(selectedLocation, parsedAlly);
    }
  };

  // Cancel map location selection
  const cancelMapLocation = () => {
    setIsSelectingOnMap(false);
    setTempMapLocation(null);
    setIsCollapsed(false); // Expand bottom box again
    
    // If canceling from different location selection, revert to current location
    if (workLocation === "different" && !selectedWorkLocation) {
      setWorkLocation("current");
      setShowLocationInput(false);
    }
  };

  // Update route between two points
  const updateRoute = async (startLocation, endLocation) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}?overview=full&geometries=polyline`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.routes?.length > 0) {
        const route = data.routes[0];
        const decoded = polyline.decode(route.geometry);
        const coords = decoded.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);
        const distanceKm = (route.distance / 1000).toFixed(2);
        setDistance(distanceKm);
        
        // Calculate fare and ETA
        const calculatedFare = calculateTripFare(distanceKm, selectedSkillsArr, selectedAssetsArr);
        const calculatedETA = calculateETA(distanceKm);
        setTripFare(calculatedFare);
        setEta(calculatedETA);
      }
    } catch (err) {
      console.error("Error updating route:", err);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!parsedAlly) return;
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Please allow location access.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        if (!active) return;
        setLocation(loc.coords);
        setSelectedWorkLocation(loc.coords);

        // Use OSRM (no API key needed)
        updateRoute(loc.coords, parsedAlly);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [ally]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleVerifyOTP = () => {
    if (otp === "1234") {
      setVerified(true);
      Alert.alert("✅ OTP Verified", "Trip confirmed successfully!");
      Keyboard.dismiss();
    } else {
      setVerified(false);
      Alert.alert("❌ Incorrect OTP", "Please try again.");
    }
  };

  const toggleCollapse = () => {
    if (!isSelectingOnMap) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  // Handle map press to collapse bottom box
  const handleMapPress = () => {
    if (!isCollapsed && !isSelectingOnMap) {
      setIsCollapsed(true);
    }
  };

  const handleOtpInputFocus = () => {
    setIsCollapsed(false);
  };

  if (!parsedAlly) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>No ally selected!</Text>
      </View>
    );
  }

  if (loading || !location) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-2 text-gray-600">Fetching location & route...</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-red-500 rounded-full"
        >
          <Text className="text-white font-semibold">Cancel Trip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        region={
          isSelectingOnMap && tempMapLocation
            ? {
                latitude: tempMapLocation.latitude,
                longitude: tempMapLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : selectedWorkLocation && workLocation === "different"
            ? {
                latitude: selectedWorkLocation.latitude,
                longitude: selectedWorkLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
        onPress={(e) => {
          if (isSelectingOnMap) {
            setTempMapLocation(e.nativeEvent.coordinate);
          } else {
            handleMapPress();
          }
        }}
      >
        {/* User marker */}
        <Marker 
          coordinate={
            workLocation === "different" && selectedWorkLocation
              ? selectedWorkLocation
              : location
          }
        >
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: 'white',
            backgroundColor: 'white',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 22.5,
              }}
              resizeMode="cover"
            />
          </View>
        </Marker>

        {/* Temporary map selection marker */}
        {isSelectingOnMap && tempMapLocation && (
          <Marker coordinate={tempMapLocation}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#007AFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="location" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Ally marker */}
        <Marker
          coordinate={{
            latitude: parsedAlly.latitude,
            longitude: parsedAlly.longitude,
          }}
        >
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: 'white',
            backgroundColor: 'white',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <Image
              source={{ uri: parsedAlly.image }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 22.5,
              }}
              resizeMode="cover"
            />
          </View>
        </Marker>

        {/* Route line */}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#007AFF" strokeWidth={4} />
        )}
      </MapView>

      {/* Map Selection Overlay */}
      {isSelectingOnMap && (
        <View className="absolute top-0 left-0 right-0 bg-blue-500 p-4">
          <Text className="text-white text-center font-bold text-lg">
            Tap on map to select work location
          </Text>
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity 
              onPress={cancelMapLocation}
              className="px-4 py-2 bg-red-500 rounded-lg"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={confirmMapLocation}
              className="px-4 py-2 bg-green-500 rounded-lg"
              disabled={!tempMapLocation}
            >
              <Text className="text-white font-semibold">Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Info Box - Fixed responsive positioning */}
      {!isSelectingOnMap && (
        <View 
          className="absolute left-0 right-0 p-4"
          style={{ 
            bottom: isKeyboardVisible ? keyboardHeight + 10 : 0,
            maxHeight: screenHeight * 0.7,
          }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="bg-white mt-2 rounded-3xl p-4 shadow-xl border border-gray-100">
              {/* Collapse Button */}
              <TouchableOpacity
                onPress={toggleCollapse}
                className="absolute -top-2 left-0 right-0 items-center z-10"
              >
                <View className="bg-blue-50 w-8 h-8 rounded-full justify-center items-center border border-blue-600">
                  <Ionicons 
                    name={isCollapsed ? "chevron-up-outline" : "chevron-down-outline"} 
                    size={16} 
                    color="#2563eb" 
                  />
                </View>
              </TouchableOpacity>

              {isCollapsed ? (
                // Collapsed View
                <View className="flex-row items-center"
                 onPress={() => setIsCollapsed(true)}
                >
                    <Image
                      source={{ uri: parsedAlly.image }}
                      className="w-14 h-14 rounded-full mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-lg font-semibold">{parsedAlly.name}</Text>
                      <Text className="text-gray-500">
                        {distance ? `${distance} km away` : "Calculating..."}
                      </Text>
                    </View>
                    {/* Ally Rating */}
                    <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-full">
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text className="ml-1 text-amber-700 font-semibold text-sm">
                        {parsedAlly.rating || "4.5"}
                      </Text>
                    </View>
                  </View>
              ) : (
                // Expanded View
                <>
                  {/* Ally Info */}
                  <View className="flex-row items-center mt-2">
                    <Image
                      source={{ uri: parsedAlly.image }}
                      className="w-14 h-14 rounded-full mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-lg font-semibold">{parsedAlly.name}</Text>
                      <Text className="text-gray-500">
                        {distance ? `${distance} km away` : "Calculating..."}
                      </Text>
                    </View>
                    {/* Ally Rating */}
                    <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-full">
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text className="ml-1 text-amber-700 font-semibold text-sm">
                        {parsedAlly.rating || "4.5"}
                      </Text>
                    </View>
                  </View>

                  {/* Skills & Assets - Clean & Beautiful Design */}
                  <View className="mt-4">
                    {/* Selected Work - Show this first since it's most important */}
                    {(selectedSkillsArr.length > 0 || selectedAssetsArr.length > 0) && (
                      <View className="mb-4 bg-green-50 rounded-2xl p-3 border border-green-100">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                          <Text className="text-green-800 font-semibold ml-2 text-sm">Selected for Work</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {[...selectedSkillsArr, ...selectedAssetsArr].map((item, i) => (
                            <View key={i} className="bg-white px-3 py-1.5 rounded-full mr-2 border border-green-200">
                              <Text className="text-green-700 text-xs font-medium">✓ {item}</Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Ally Skills - Now with click functionality */}
                    <View className="mb-3">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="build" size={16} color="#6366f1" />
                        <Text className="text-blue-600 font-semibold ml-2 text-sm">Ally's Skills</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {parsedAlly.skills.map((skill, i) => (
                          <TouchableOpacity
                            key={i}
                            onPress={() => handleSkillPress(skill)}
                          >
                            <View
                              className={`px-3 py-1.5 rounded-full mr-2 ${
                                selectedSkillsArr.includes(skill)
                                  ? "bg-blue-500"
                                  : "bg-blue-50 border border-blue-200"
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  selectedSkillsArr.includes(skill)
                                    ? "text-white"
                                    : "text-blue-700"
                                }`}
                              >
                                {selectedSkillsArr.includes(skill) ? "✓ " : ""}{skill}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Ally Assets - Now with click functionality */}
                    <View className="mb-3">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="briefcase" size={16} color="#8b5cf6" />
                        <Text className="text-purple-600 font-semibold ml-2 text-sm">Ally's Assets</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {parsedAlly.assets.map((item, i) => (
                          <TouchableOpacity
                            key={i}
                            onPress={() => handleAssetPress(item)}
                          >
                            <View
                              className={`px-3 py-1.5 rounded-full mr-2 ${
                                selectedAssetsArr.includes(item)
                                  ? "bg-purple-500"
                                  : "bg-purple-50 border border-purple-200"
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  selectedAssetsArr.includes(item)
                                    ? "text-white"
                                    : "text-purple-700"
                                }`}
                              >
                                {selectedAssetsArr.includes(item) ? "✓ " : ""}{item}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                  
                  {/* Info Text for Skills/Assets */}
                  <View className="mt-2 bg-yellow-50 rounded-2xl p-3 border border-gray-200">
                    <View className="flex-row items-start">
                      <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-2 flex-1">
                         Tap skills/assets to add or remove from selected work
                      </Text>
                    </View>
                  </View>

                  {/* Trip Fare & ETA Section */}
                  <View className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-blue-800 font-bold text-lg">Trip Fare</Text>
                      <Text className="text-green-600 font-bold text-lg">₹{tripFare}</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6366f1" />
                        <Text className="ml-1 text-blue-700 font-semibold">ETA</Text>
                      </View>
                      <Text className="text-blue-800 font-semibold">{eta}</Text>
                    </View>
                    
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="star" size={16} color="#f59e0b" />
                      <Text className="ml-1 text-amber-600 font-semibold">{parsedAlly.rating || "4.5"}</Text>
                      <Text className="ml-1 text-gray-500 text-sm">({parsedAlly.reviews || "128"} reviews)</Text>
                    </View>
                  </View>
                  
                  {/* Work Location Selector */}
                  <View className="mt-4 bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={18} color="#6366f1" />
                      <Text className="text-indigo-700 font-semibold ml-2 text-base">Work Location</Text>
                    </View>
                    
                    <View className="flex-row justify-between gap-x-4 mb-3">
                      <TouchableOpacity 
                        className={`flex-1 py-3 rounded-xl border ${
                          workLocation === "current" ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'
                        }`}
                        onPress={() => handleWorkLocationChange("current")}
                      >
                        <Text className={`text-center font-semibold ${
                          workLocation === "current" ? 'text-white' : 'text-gray-600'
                        }`}>
                          Current Location
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className={`flex-1 py-3 rounded-xl border ${
                          workLocation === "different" ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'
                        }`}
                        onPress={() => handleWorkLocationChange("different")}
                      >
                        <Text className={`text-center font-semibold ${
                          workLocation === "different" ? 'text-white' : 'text-gray-600'
                        }`}>
                          Different Location
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Different Location Status */}
                    {showLocationInput && (
                      <View className="mt-3">
                        <Text className="text-blue-600 text-sm text-center">
                          📍 {selectedWorkLocation && workLocation === "different" 
                            ? "Location set! Route updated." 
                            : "Tap 'Choose from Map' to select location"}
                        </Text>
                        
                        {/* Map Selection Button */}
                        <TouchableOpacity 
                          className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center mt-2"
                          onPress={handleMapLocationSelect}
                        >
                          <Ionicons name="map-outline" size={18} color="white" />
                          <Text className="text-white font-semibold ml-2">Choose from Map</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Special Instructions */}
                  <View className="mt-4 bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8b5cf6" />
                      <Text className="text-purple-700 font-semibold ml-2 text-base">Special Instructions</Text>
                    </View>
                    <TextInput
                      value={specialInstructions}
                      onChangeText={setSpecialInstructions}
                      placeholder="Any specific instructions for the ally..."
                      multiline
                      numberOfLines={2}
                      className="border border-purple-200 rounded-xl p-3 text-gray-700 bg-white text-base"
                    />
                  </View>

                  {/* My Assets for Support */}
                  <View className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="briefcase-outline" size={18} color="#f59e0b" />
                      <Text className="text-amber-700 font-semibold ml-2 text-base">My Assets (I will provide)</Text>
                    </View>
                    <TextInput
                      value={myAssets}
                      onChangeText={setMyAssets}
                      placeholder="e.g., Documents, Tools, Materials I have..."
                      multiline
                      numberOfLines={2}
                      className="border border-amber-200 rounded-xl p-3 text-gray-700 bg-white text-base"
                    />
                  </View>

                  {/* OTP Section */}
                  <View className="mt-4 bg-green-50 rounded-2xl p-4 border border-green-100">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="lock-closed-outline" size={18} color="#16a34a" />
                      <Text className="text-green-700 font-semibold ml-2 text-base">Confirm Trip with OTP</Text>
                    </View>
                    
                    <Text className="text-gray-600 mb-3">Enter OTP sent to ally's screen to confirm trip:</Text>
                    <View className="flex-row items-center">
                      <TextInput
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        placeholder="Enter 4-digit OTP"
                        className="flex-1 border border-green-200 rounded-xl p-3 text-center text-lg font-bold text-green-800 bg-white"
                        maxLength={4}
                        onFocus={handleOtpInputFocus}
                      />
                      <TouchableOpacity
                        onPress={handleVerifyOTP}
                        className="ml-3 px-6 py-3 bg-green-600 rounded-xl shadow-sm"
                      >
                        <Text className="text-white font-bold text-base">Verify</Text>
                      </TouchableOpacity>
                    </View>
                    {verified && (
                      <View className="flex-row items-center justify-center mt-3 bg-green-100 py-2 rounded-lg">
                        <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                        <Text className="text-green-700 font-semibold ml-2">Verified Successfully</Text>
                      </View>
                    )}
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 bg-red-500 py-4 rounded-2xl shadow-sm"
                  >
                    <Text className="text-white text-center font-bold text-base">
                      Cancel Trip
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}