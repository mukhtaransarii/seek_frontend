import CustomHeader from '../components/CustomHeader';
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  BackHandler
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
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
  
  // Trip related states
  const [tripFare, setTripFare] = useState(0);
  const [eta, setEta] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [myAssets, setMyAssets] = useState("");
  const [workLocation, setWorkLocation] = useState("current");
  const [differentLocationAddress, setDifferentLocationAddress] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  
  // Location selection states
  const [selectedWorkLocation, setSelectedWorkLocation] = useState(null);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState(null);

  // Map options states
  const [mapType, setMapType] = useState('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showMapOptions, setShowMapOptions] = useState(false);
  const [userLocationEnabled, setUserLocationEnabled] = useState(true);
  
  // Correct BackHandler implementation
  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Prevent going back - return true blocks the back button
          return true;
        }
      );
  
      return () => {
        subscription.remove(); // Correct cleanup method
      };
    }, [])
  );
  
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
      setSelectedSkillsArr(selectedSkillsArr.filter(s => s !== skill));
    } else {
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
      setSelectedAssetsArr(selectedAssetsArr.filter(a => a !== asset));
    } else {
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
      handleMapLocationSelect();
    } else {
      setShowLocationInput(false);
      setDifferentLocationAddress("");
      setSelectedWorkLocation(null);
      updateRoute(location, parsedAlly);
    }
  };

  // Handle map location selection
  const handleMapLocationSelect = () => {
    setIsSelectingOnMap(true);
    setIsCollapsed(true);
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
      setIsCollapsed(false);
      
      updateRoute(selectedLocation, parsedAlly);
    }
  };

  // Cancel map location selection
  const cancelMapLocation = () => {
    setIsSelectingOnMap(false);
    setTempMapLocation(null);
    setIsCollapsed(false);
    
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
        
        const calculatedFare = calculateTripFare(distanceKm, selectedSkillsArr, selectedAssetsArr);
        const calculatedETA = calculateETA(distanceKm);
        setTripFare(calculatedFare);
        setEta(calculatedETA);
      }
    } catch (err) {
      console.error("Error updating route:", err);
    }
  };

  // Map Options Functions
  const toggleMapOptions = () => {
    setShowMapOptions(!showMapOptions);
  };

  const changeMapType = (type) => {
    setMapType(type);
    setShowMapOptions(false);
  };

  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
  };

  const toggleUserLocation = () => {
    setUserLocationEnabled(!userLocationEnabled);
  };

  const focusOnUserLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setShowMapOptions(false);
    } catch (err) {
      console.error("Error getting current location:", err);
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  const focusOnAllyLocation = () => {
    setShowMapOptions(false);
  };

  const closeMapOptions = () => {
    setShowMapOptions(false);
  };

  // Handle map press
  const handleMapPress = (e) => {
    if (isSelectingOnMap) {
      setTempMapLocation(e.nativeEvent.coordinate);
    } else if (!isCollapsed && !isSelectingOnMap) {
      setIsCollapsed(true);
    }
  };

  const getRegion = () => {
    if (isSelectingOnMap && tempMapLocation) {
      return {
        latitude: tempMapLocation.latitude,
        longitude: tempMapLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else if (selectedWorkLocation && workLocation === "different") {
      return {
        latitude: selectedWorkLocation.latitude,
        longitude: selectedWorkLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
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
      {/* Main Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        mapType={mapType}
        showsTraffic={showTraffic}
        showsUserLocation={userLocationEnabled}
        region={getRegion()}
        onPress={handleMapPress}
      >
        {/* User marker - Only show if user location is disabled */}
        {userLocationEnabled && (
          <Marker 
            coordinate={
              workLocation === "different" && selectedWorkLocation
                ? selectedWorkLocation
                : location
            }
          >
            <View className="w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden justify-center items-center">
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            </View>
          </Marker>
        )}

        {/* Temporary map selection marker */}
        {isSelectingOnMap && tempMapLocation && (
          <Marker coordinate={tempMapLocation}>
            <View className="w-10 h-10 rounded-full bg-blue-500 justify-center items-center">
              <Ionicons name="location" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Ally marker */}
        <Marker coordinate={parsedAlly}>
          <View className="w-12 h-12 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden justify-center items-center">
            <Image
              source={{ uri: parsedAlly.image }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          </View>
        </Marker>

        {/* Route line */}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#007AFF" strokeWidth={4} />
        )}
      </MapView>

      {/* Google Maps Style Vertical Controls - Top Right */}
      {!isSelectingOnMap && (
        <View className="absolute top-16 right-4">
          {/* Map Type Toggle Button */}
          <TouchableOpacity
            onPress={toggleMapOptions}
            className="bg-white w-12 h-12 rounded-full justify-center items-center shadow-lg border border-gray-200 mb-2"
          >
            <Ionicons name="layers-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      {/* Map Options Modal */}
      {showMapOptions && !isSelectingOnMap && (
        <View className="absolute top-32 right-4 bg-white rounded-3xl p-5 shadow-2xl border border-gray-200 w-56">
          <Text className="text-lg font-bold text-gray-800 mb-4 text-center">Map Options</Text>
          
          {/* Map Type Options */}
          <Text className="text-sm font-semibold text-gray-600 mb-3">Map Type</Text>
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity 
              onPress={() => changeMapType('standard')}
              className={`flex-1 mx-1 px-[2px] py-2 rounded-xl ${mapType === 'standard' ? 'bg-blue-500' : 'bg-blue-50 border border-blue-200'}`}
            >
              <Text className={`text-center text-xs font-semibold ${mapType === 'standard' ? 'text-white' : 'text-blue-700'}`}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => changeMapType('satellite')}
              className={`flex-1 mx-1 px-[2px] py-2 rounded-xl ${mapType === 'satellite' ? 'bg-green-500' : 'bg-green-50 border border-green-200'}`}
            >
              <Text className={`text-center text-xs font-semibold ${mapType === 'satellite' ? 'text-white' : 'text-green-700'}`}>Satellite</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => changeMapType('hybrid')}
              className={`flex-1 mx-1 px-[2px] py-2 rounded-xl ${mapType === 'hybrid' ? 'bg-purple-500' : 'bg-purple-50 border border-purple-200'}`}
            >
              <Text className={`text-center text-xs font-semibold ${mapType === 'hybrid' ? 'text-white' : 'text-purple-700'}`}>Hybrid</Text>
            </TouchableOpacity>
          </View>
      
          {/* Toggle Options */}
          <View className="">
            <TouchableOpacity 
              onPress={toggleTraffic}
              className="mb-4 flex-row items-center py-2 px-4 bg-blue-50 rounded-xl border border-blue-100"
            >
              <Ionicons 
                name={showTraffic ? "car" : "car-outline"} 
                size={20} 
                color={showTraffic ? "#10b981" : "#3b82f6"} 
              />
              <Text className="ml-3 text-sm font-semibold text-blue-700 flex-1">Show Traffic</Text>
              <View className={`w-4 h-4 rounded-full border-2 ${showTraffic ? 'bg-green-500 border-green-500' : 'bg-white border-blue-300'}`} />
            </TouchableOpacity>
      
            <TouchableOpacity 
              onPress={toggleUserLocation}
              className="flex-row items-center py-2 px-4 bg-indigo-50 rounded-xl border border-indigo-100"
            >
              <Ionicons 
                name={userLocationEnabled ? "location" : "location-outline"} 
                size={20} 
                color={userLocationEnabled ? "#3b82f6" : "#6366f1"} 
              />
              <Text className="ml-3 text-sm font-semibold text-indigo-700 flex-1">My Location</Text>
              <View className={`w-4 h-4 rounded-full border-2 ${userLocationEnabled ? 'bg-blue-500 border-blue-500' : 'bg-white border-indigo-300'}`} />
            </TouchableOpacity>
          </View>
      
          {/* Close Button */}
          <TouchableOpacity 
            onPress={closeMapOptions}
            className="mt-4 bg-gray-100 py-3 rounded-xl border border-gray-300"
          >
            <Text className="text-gray-600 text-center text-sm font-semibold">Close Options</Text>
          </TouchableOpacity>
        </View>
      )}

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
                <View className="flex-row items-center">
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

                  {/* Skills & Assets */}
                  <View className="mt-4">
                    {/* Selected Work */}
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

                    {/* Ally Skills */}
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

                    {/* Ally Assets */}
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