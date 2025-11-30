import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTrip } from "../hooks/useTrip";

export default function ConfirmTrip() {
  const { confirmTrip, tripStatus, driver, fare, vehicleType } = useTrip();

  return (
    <View className="absolute bottom-8 w-full px-3">
      <View className="bg-white rounded-2xl shadow-lg p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Confirm Trip</Text>

        <Text className="text-gray-700">Vehicle: {vehicleType}</Text>
        <Text className="text-gray-700">Fare: {fare[vehicleType]}</Text>
        <Text className="text-gray-700">Status: {tripStatus}</Text>
        {driver && <Text className="text-gray-700">Driver: {driver.name}</Text>}

        <TouchableOpacity
          className="bg-green-600 rounded-xl p-3 mt-4"
          onPress={confirmTrip}
        >
          <Text className="text-white text-center font-semibold">Confirm Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
