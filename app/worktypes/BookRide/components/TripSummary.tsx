import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../RideContext.tsx';
//import { confirmTrip } from '../hooks/useTrip'

export default function TripSummary() {
  const { setStep, pickup, drop, eta, distance, fare, setVehicleType } = useRide();
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  
  console.log("fare", fare)
  
  function handleGoBack() {
    setStep(1);
  }
 
  function handleConfirm() {
    //const data = await confirmTrip(); // call from useRide
    Alert.alert("Trip Confirmed", `Driver finding...`);
    //setStep(3); // move to live tracking or next step
  };
  

  const vehicles = [
    { id: 'bike', name: 'Bike', icon: 'bicycle', seats: '1 Seater', price: fare.bike, color: 'purple' },
    { id: 'auto', name: 'Auto', icon: 'car', seats: '3 Seater', price: fare.auto, color: 'orange' },
    { id: 'sedan', name: 'Sedan', icon: 'car-sport', seats: '4 Seater', price: fare.sedan, color: 'blue' },
    { id: 'suv', name: 'SUV', icon: 'car', seats: '6 Seater', price: fare.suv, color: 'green' },
  ];

  const getVehicleIcon = (vehicle) => {
    const colorMap = {
      purple: '#8B5CF6',
      orange: '#F97316',
      blue: '#3B82F6',
      green: '#10B981'
    };
    return colorMap[vehicle.color];
  };

  return (
    <View className="absolute bottom-8 w-full px-3">
      <View className="bg-white rounded-2xl shadow-lg">
       
        {/* Compact Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-green-500 rounded-full mr-2"></View>
            <Text className="text-lg font-bold text-gray-800">Trip Summary</Text>
          </View>
       
          <View className="flex-row">
            <Text className="text-sm font-semibold text-gray-700">{eta}</Text>
            <Text className="text-sm font-semibold text-gray-700"> (</Text>
            <Text className="text-sm font-semibold text-red-500">{distance}</Text>
            <Text className="text-sm font-semibold text-gray-700">)</Text>
          </View>
        </View>

        
          {/* Location Cards - Full Address Display */}
          <View className="p-3">
            {/* Pickup Location */}
            <View className="flex-row items-start mb-4">
              <View className="w-6 h-6 bg-green-500 rounded-full justify-center items-center mr-3 mt-1">
                <Ionicons name="location" size={12} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-green-700 font-bold text-sm">Pickup</Text>
                <Text className="text-gray-900 text-sm" numberOfLines={2}>
                  {pickup?.humanAddress.display_name || "Current Location"}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {[
                    pickup?.humanAddress.address?.road,
                    pickup?.humanAddress.address?.suburb,
                    pickup?.humanAddress.address?.city || pickup?.humanAddress.address?.town || pickup?.humanAddress.address?.village,
                    pickup?.humanAddress.address?.state,
                    pickup?.humanAddress.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>

            {/* Drop Location */}
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-red-500 rounded-full justify-center items-center mr-3 mt-1">
                <Ionicons name="location" size={12} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-red-700 font-bold text-sm">Drop</Text>
                <Text className="text-gray-900 text-sm" numberOfLines={2}>
                  {drop?.humanAddress.display_name || "Selected Location"}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {[
                    drop?.humanAddress.address?.road,
                    drop?.humanAddress.address?.suburb,
                    drop?.humanAddress.address?.city || drop?.humanAddress.address?.town || drop?.humanAddress.address?.village,
                    drop?.humanAddress.address?.state,
                    drop?.humanAddress.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>
          </View>
        

        {/* Compact Vehicle Selection */}
        <View className="p-3">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Choose your ride</Text>
          
          <View className="flex flex-row justify-between overflow-hidden">
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                className={`px-3 py-2 rounded-xl border-2 ${
                  selectedVehicle === vehicle.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                } min-w-[70px] items-center`}
                onPress={() => {
                  setSelectedVehicle(vehicle.id);
                  setVehicleType(vehicle.id)
                }}
              >
                <View 
                  className="w-8 h-8 rounded-full justify-center items-center mb-1"
                  style={{ backgroundColor: getVehicleIcon(vehicle) }}
                >
                  <Ionicons name={vehicle.icon} size={16} color="white" />
                </View>
                <Text className="text-xs font-semibold text-gray-800">{vehicle.name}</Text>
                <Text className="text-xs text-gray-600">{vehicle.seats}</Text>
                <Text className="text-sm font-bold text-gray-900 mt-1">{vehicle.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View className="flex-row justify-between gap-3 p-3 pb-5">
          <TouchableOpacity 
            className="flex-1 bg-gray-100 rounded-xl p-3 border border-gray-200"
            onPress={handleGoBack}
          >
            <Text className="text-gray-700 text-center font-semibold">Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-green-600 rounded-xl p-3"
            onPress={handleConfirm}
          >
            <Text className="text-white text-center font-semibold">
              Confirm • {vehicles.find(v => v.id === selectedVehicle)?.price}
            </Text>
          </TouchableOpacity>
        </View>
          
      </View>
    </View>
  );
}