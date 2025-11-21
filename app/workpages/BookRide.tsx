import CustomHeader from '../../components/CustomHeader';
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, Image, BackHandler } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapTrip from '../../components/MapTrip';
import BottomBox from '../../components/BottomBox';
import MapPickDrop from '../../components/MapPickDrop';
import { alliesData } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookRide() {
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState(null);
  const [selectedAlly, setSelectedAlly] = useState(alliesData[0]);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [myAssets, setMyAssets] = useState("");
  const [selectedSkillsArr, setSelectedSkillsArr] = useState(["Driving", "Delivery"]);
  const [selectedAssetsArr, setSelectedAssetsArr] = useState(["Car"]);

  // Demo data - CONST VALUES
  const distance = "12.5";
  const fare = "185";
  const eta = "25 minutes";

  // Lock the screen - prevent going back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent default back behavior
    });

    // Save booking state when step changes to 2
    if (step === 2) {
      saveBookingState();
    }

    return () => backHandler.remove();
  }, [step]);

  // Load saved booking state when component mounts
  useEffect(() => {
    loadBookingState();
  }, []);

  const loadBookingState = async () => {
    try {
      const savedBooking = await AsyncStorage.getItem('activeBooking');
      if (savedBooking) {
        const bookingData = JSON.parse(savedBooking);
        setStep(bookingData.step);
        setLocations(bookingData.locations);
        setSelectedAlly(bookingData.selectedAlly);
        // Show alert that booking was restored
        Alert.alert(
          "Booking Restored",
          "Your active booking has been restored.",
          [{ text: "Continue" }]
        );
      }
    } catch (error) {
      console.log('Error loading booking state:', error);
    }
  };

  const saveBookingState = async () => {
    try {
      const bookingData = {
        step,
        locations,
        selectedAlly,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem('activeBooking', JSON.stringify(bookingData));
    } catch (error) {
      console.log('Error saving booking state:', error);
    }
  };

  const clearBookingState = async () => {
    try {
      await AsyncStorage.removeItem('activeBooking');
    } catch (error) {
      console.log('Error clearing booking state:', error);
    }
  };

  const handleLocationsSelected = (selectedLocations) => {
    setLocations(selectedLocations);
    setStep(2);
  };

  const handleVerifyOTP = () => {
    if (otp === "1234") {
      setVerified(true);
      clearBookingState(); // Clear when trip is confirmed
      Alert.alert("✅ OTP Verified", "Trip confirmed successfully!", [
        { 
          text: "OK", 
          onPress: () => router.back() // Only allow going back after verification
        }
      ]);
    } else {
      setVerified(false);
      Alert.alert("❌ Incorrect OTP", "Please try again.");
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      "Cancel Trip",
      "Are you sure you want to cancel this trip?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            clearBookingState();
            router.back(); // Only allow going back after cancellation
          }
        }
      ]
    );
  };

  // STEP 1: Location Selection
  if (step === 1) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader title="Book Ride - Select Locations" />
        <MapPickDrop
          onLocationsSelected={handleLocationsSelected}
          needsPickup={true}
          needsDrop={true}
          initialTitle="Book a Ride"
        />
      </View>
    );
  }

  // Collapsed View Content - More Compact
  const collapsedContent = (
    <View className="flex-row items-center justify-between h-full px-2">
      <View className="flex-row items-center flex-1">
        <Image
          source={{ uri: selectedAlly.image }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {selectedAlly.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location" size={12} color="#6b7280" />
            <Text className="text-gray-500 text-xs ml-1">
              {distance} km • ₹{fare}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-center space-x-2">
        <View className="flex-row items-center bg-amber-500 px-2 py-1 rounded-full">
          <Ionicons name="star" size={12} color="white" />
          <Text className="text-white font-bold text-xs ml-1">
            {selectedAlly.rating}
          </Text>
        </View>
        <View className="bg-green-100 px-2 py-1 rounded-full">
          <Text className="text-green-700 text-xs font-bold">Active</Text>
        </View>
      </View>
    </View>
  );

  // Expanded View Content
  const expandedContent = (
    <View className="pb-4">
      {/* Ally Info */}
      <View className="flex-row items-center mb-6">
        <Image
          source={{ uri: selectedAlly.image }}
          className="w-16 h-16 rounded-full mr-4"
        />
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{selectedAlly.name}</Text>
          <Text className="text-gray-500">
            {distance ? `${distance} km away` : "Calculating..."}
          </Text>
        </View>
        <View className="flex-row items-center bg-amber-500 px-3 py-2 rounded-full">
          <Ionicons name="star" size={16} color="white" />
          <Text className="ml-1 text-white font-bold text-sm">
            {selectedAlly.rating || "4.5"}
          </Text>
        </View>
      </View>

      {/* Trip Summary */}
      <View className="bg-blue-50 p-5 rounded-2xl border border-blue-200 mb-6">
        <Text className="text-blue-800 font-bold text-xl mb-4 text-center">Trip Summary</Text>
        
        <View className="space-y-4">
          {/* Ally Current Location */}
          <View className="flex-row items-start">
            <View className="w-8 h-8 bg-blue-500 rounded-full justify-center items-center mr-3 mt-1">
              <Ionicons name="navigate" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-blue-700 font-bold text-base">Ally Current Location</Text>
              <Text className="text-gray-600 text-sm mt-1">
                {selectedAlly.name} is on the way
              </Text>
            </View>
          </View>

          {/* Pickup Location */}
          <View className="flex-row items-start">
            <View className="w-8 h-8 bg-green-500 rounded-full justify-center items-center mr-3 mt-1">
              <Ionicons name="location" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-green-700 font-bold text-base">Pickup</Text>
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                {locations?.pickup?.address || "Current Location"}
              </Text>
            </View>
          </View>

          {/* Drop Location */}
          <View className="flex-row items-start">
            <View className="w-8 h-8 bg-red-500 rounded-full justify-center items-center mr-3 mt-1">
              <Ionicons name="flag" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-red-700 font-bold text-base">Drop</Text>
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                {locations?.drop?.address || "Selected Location"}
              </Text>
            </View>
          </View>

          {/* Work Type */}
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-purple-500 rounded-full justify-center items-center mr-3">
              <Ionicons name="briefcase" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-purple-700 font-bold text-base">Service</Text>
              <Text className="text-gray-600 text-sm mt-1">Ride Service</Text>
            </View>
          </View>
        </View>

        {/* Route Legend */}
        <View className="mt-4 pt-4 border-t border-blue-200">
          <Text className="text-blue-800 font-semibold mb-3">Route:</Text>
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <View className="w-6 h-2 bg-blue-500 rounded mr-2" />
              <Text className="text-blue-700 text-sm">Ally → Pickup</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-2 bg-green-500 rounded mr-2" />
              <Text className="text-green-700 text-sm">Pickup → Drop</Text>
            </View>
          </View>
        </View>

        {/* Fare & ETA */}
        <View className="mt-6 pt-4 border-t border-blue-200">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-blue-800 font-bold text-lg">Total Fare</Text>
            <Text className="text-green-600 font-bold text-xl">₹{fare}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="#6366f1" />
              <Text className="ml-2 text-blue-700 font-semibold">ETA</Text>
            </View>
            <Text className="text-blue-800 font-semibold text-base">{eta}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text className="ml-2 text-amber-600 font-semibold">{selectedAlly.rating || "4.5"}</Text>
            <Text className="ml-2 text-gray-500 text-sm">({selectedAlly.reviews || "128"} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      <View className="bg-purple-50 rounded-2xl p-4 border border-purple-200 mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8b5cf6" />
          <Text className="text-purple-700 font-bold ml-2 text-base">Special Instructions</Text>
        </View>
        <TextInput
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          placeholder="Any specific instructions for the ally..."
          multiline
          numberOfLines={3}
          className="border border-purple-300 rounded-xl p-3 text-gray-700 bg-white text-base leading-5"
        />
      </View>

      {/* My Assets for Support */}
      <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="briefcase-outline" size={18} color="#f59e0b" />
          <Text className="text-amber-700 font-bold ml-2 text-base">My Assets (I will provide)</Text>
        </View>
        <TextInput
          value={myAssets}
          onChangeText={setMyAssets}
          placeholder="e.g., Documents, Tools, Materials I have..."
          multiline
          numberOfLines={3}
          className="border border-amber-300 rounded-xl p-3 text-gray-700 bg-white text-base leading-5"
        />
      </View>

      {/* OTP Section */}
      <View className="bg-green-50 rounded-2xl p-4 border border-green-200 mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="lock-closed-outline" size={18} color="#16a34a" />
          <Text className="text-green-700 font-bold ml-2 text-base">Confirm Trip with OTP</Text>
        </View>
        
        <Text className="text-gray-600 mb-3 text-center text-sm">
          Enter OTP sent to ally's screen to confirm trip:
        </Text>
        <View className="flex-row items-center">
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            placeholder="Enter 4-digit OTP"
            className="flex-1 border-2 border-green-300 rounded-xl p-3 text-center text-lg font-bold text-green-800 bg-white"
            maxLength={4}
          />
          <TouchableOpacity
            onPress={handleVerifyOTP}
            className="ml-3 px-6 py-3 bg-green-600 rounded-xl shadow-lg"
          >
            <Text className="text-white font-bold text-base">Verify</Text>
          </TouchableOpacity>
        </View>
        {verified && (
          <View className="flex-row items-center justify-center mt-3 bg-green-100 py-2 rounded-lg">
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text className="text-green-700 font-bold ml-2 text-sm">Verified Successfully</Text>
          </View>
        )}
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        onPress={handleCancelTrip}
        className="bg-red-500 py-4 rounded-2xl shadow-lg mb-2"
      >
        <Text className="text-white text-center font-bold text-lg">
          Cancel Trip
        </Text>
      </TouchableOpacity>
    </View>
  );

  // STEP 2: Booking Confirmation
  return (
    <View className="flex-1 bg-white">
      {/* Map with all locations */}
      <MapTrip
        allyCurrentLocation={selectedAlly.currentLocation}
        pickupLocation={locations?.pickup?.location}
        dropLocation={locations?.drop?.location}
        seekCurrentLocation={true}
        showRoutes={true}
        allyImage={selectedAlly.image}
      />

      {/* Bottom Booking Panel */}
      <BottomBox 
        collapsedView={collapsedContent}
        expandedView={expandedContent}
        defaultCollapsed={false}
      />
    </View>
  );
}