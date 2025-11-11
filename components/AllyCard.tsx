import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function AllyCard({ ally }) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const router = useRouter();

  const toggleSelect = (item, setFunc, list) => {
    if (list.includes(item)) {
      setFunc(list.filter((i) => i !== item));
    } else {
      setFunc([...list, item]);
    }
  };

  const handleContinue = () => {
    // Merge selected skills/assets and navigate
    const allyWithSelection = { ...ally, selectedSkills, selectedAssets };
    router.push({
      pathname: "/TripBooking",
      params: { ally: JSON.stringify(allyWithSelection) }, // pass as string
    });
  };

  return (
    <View className="bg-white p-4 mb-4 rounded-2xl shadow">
      {/* Profile */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: ally.image }}
          className="w-14 h-14 rounded-full mr-4"
        />
        <View>
          <Text className="text-xl font-semibold text-gray-900">{ally.name}</Text>
          <Text className="text-gray-500">⭐ {ally.rating} | Trips: {ally.trips}</Text>
        </View>
      </View>

      {/* Skills */}
      <Text className="mt-1 mb-1 text-gray-700 font-semibold">Skills</Text>
      <View className="flex-row flex-wrap gap-2">
        {ally.skills.map((skill, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => toggleSelect(skill, setSelectedSkills, selectedSkills)}
            className={`px-3 py-1 rounded-full border ${
              selectedSkills.includes(skill)
                ? "bg-blue-500 border-blue-500"
                : "border-gray-300"
            }`}
          >
            <Text className={`${selectedSkills.includes(skill) ? "text-white" : "text-gray-700"}`}>
              {skill}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Assets */}
      <Text className="mt-3 mb-1 text-gray-700 font-semibold">Assets</Text>
      <View className="flex-row flex-wrap gap-2">
        {ally.assets.map((asset, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => toggleSelect(asset, setSelectedAssets, selectedAssets)}
            className={`px-3 py-1 rounded-full border ${
              selectedAssets.includes(asset)
                ? "bg-green-500 border-green-500"
                : "border-gray-300"
            }`}
          >
            <Text className={`${selectedAssets.includes(asset) ? "text-white" : "text-gray-700"}`}>
              {asset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue button */}
      <TouchableOpacity
        onPress={handleContinue}
        className="mt-4 bg-blue-500 py-2 rounded-xl"
      >
        <Text className="text-center text-white font-semibold">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
