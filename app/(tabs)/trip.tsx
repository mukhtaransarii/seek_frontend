import CustomHeader from '../../components/CustomHeader';
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { alliesData } from "./../../api";

export default function TripPage() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);

  const allSkills = [...new Set(alliesData.flatMap((a) => a.skills))];
  const allAssets = [...new Set(alliesData.flatMap((a) => a.assets))];

  const toggleSelect = (item, list, setList) =>
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const handleContinue = () => {
    const matchedAlly = alliesData.find(
      (ally) =>
        selectedSkills.every((s) => ally.skills.includes(s)) &&
        selectedAssets.every((a) => ally.assets.includes(a))
    );

    if (!matchedAlly) return Alert.alert("No matching ally found!");

    router.push({
      pathname: "/TripBooking",
      params: {
        ally: JSON.stringify(matchedAlly),
        selectedSkills: JSON.stringify(selectedSkills),
        selectedAssets: JSON.stringify(selectedAssets),
      },
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <CustomHeader title="Trip Booking" onBack={() => navigation.goBack()} onMenu={() => console.log("menu")}/> 

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mt-8 mb-6">
          <View className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-3">
            <Ionicons name="construct-outline" size={32} color="#6366f1" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Choose Work Requirements
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Select skills and tools needed for your work
          </Text>
        </View>
        
        {/* Info Section */}
        <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 mb-6">
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={18} color="#d97706" />
            <Text className="text-yellow-800 text-sm ml-2 flex-1">
              Tap skills and tools to select. Tap again to remove. We'll match you with the perfect ally!
            </Text>
          </View>
        </View>
        
        {/* Selected Work Preview */}
        {(selectedSkills.length > 0 || selectedAssets.length > 0) && (
          <View className="mb-6 bg-green-50 rounded-2xl p-4 border border-green-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text className="text-green-800 font-bold text-lg ml-2">
                Selected for Work
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2">
                {[...selectedSkills, ...selectedAssets].map((item, i) => (
                  <View key={i} className="bg-white px-3 py-2 rounded-full border border-green-300">
                    <Text className="text-green-700 text-sm font-medium">✓ {item}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Skills Section */}
        <View className="bg-blue-50 rounded-2xl p-5 border border-blue-200 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 p-2 rounded-xl">
              <Ionicons name="build-outline" size={20} color="#6366f1" />
            </View>
            <Text className="text-blue-800 font-bold text-xl ml-3">
              Skills Required
            </Text>
          </View>
          <Text className="text-blue-600 mb-4 text-center">
            What skills do you need for this work?
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3">
            {allSkills.map((skill) => (
              <TouchableOpacity
                key={skill}
                onPress={() => toggleSelect(skill, selectedSkills, setSelectedSkills)}
                className={`px-5 py-3 rounded-2xl border-2 shadow-sm ${
                  selectedSkills.includes(skill)
                    ? "bg-blue-500 border-blue-600 shadow-md"
                    : "bg-white border-blue-200"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedSkills.includes(skill) ? "text-white" : "text-blue-700"
                  }`}
                >
                  {selectedSkills.includes(skill) ? "✓ " : ""}{skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assets Section */}
        <View className="bg-purple-50 rounded-2xl p-5 border border-purple-200 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-purple-100 p-2 rounded-xl">
              <Ionicons name="briefcase-outline" size={20} color="#8b5cf6" />
            </View>
            <Text className="text-purple-800 font-bold text-xl ml-3">
              Tools & Assets
            </Text>
          </View>
          <Text className="text-purple-600 mb-4 text-center">
            What tools or equipment are needed?
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3">
            {allAssets.map((asset) => (
              <TouchableOpacity
                key={asset}
                onPress={() => toggleSelect(asset, selectedAssets, setSelectedAssets)}
                className={`px-5 py-3 rounded-2xl border-2 shadow-sm ${
                  selectedAssets.includes(asset)
                    ? "bg-purple-500 border-purple-600 shadow-md"
                    : "bg-white border-purple-200"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedAssets.includes(asset) ? "text-white" : "text-purple-700"
                  }`}
                >
                  {selectedAssets.includes(asset) ? "✓ " : ""}{asset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at Bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-6 bg-transparent">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedSkills.length && !selectedAssets.length}
          className={`py-4 rounded-2xl shadow-lg border-2 ${
            !selectedSkills.length && !selectedAssets.length
              ? "bg-gray-300 border-gray-400"
              : "bg-green-500 border-green-600 shadow-green-200"
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="search-outline" 
              size={20} 
              color="white" 
              className="mr-2" 
            />
            <Text className="text-center text-white font-bold text-lg tracking-wide">
              Find Your Ally 
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}