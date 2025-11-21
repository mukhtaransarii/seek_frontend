import CustomHeader from '../../components/CustomHeader';
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const workTypes = [
  {
    id: 1,
    name: "BookRide",
    displayName: "Book Ride",
    icon: "car-outline",
    description: "Transportation services",
    color: "blue"
  },
  {
    id: 2,
    name: "SendParcel", 
    displayName: "Send Parcel",
    icon: "cube-outline",
    description: "Package delivery services",
    color: "green"
  },
  {
    id: 3,
    name: "HomeService",
    displayName: "Home Services", 
    icon: "home-outline",
    description: "Cleaning, repairs & maintenance",
    color: "purple"
  },
  {
    id: 4,
    name: "EventHelper",
    displayName: "Event Help",
    icon: "people-outline",
    description: "Event setup and staffing",
    color: "orange"
  }
];

export default function TripSelection() {
  const router = useRouter();

  const handleWorkTypeSelect = (workType) => {
    // Direct redirect to service page
    router.push(`/workpages/${workType.name}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <CustomHeader title="Select Service" />
      
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="items-center mt-8 mb-8">
          <View className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 mb-4">
            <Ionicons name="business-outline" size={32} color="#6366f1" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 text-center">
            What do you need?
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Choose the type of service you require
          </Text>
        </View>

        {/* Work Type Grid */}
        <View className="flex-row flex-wrap justify-between gap-4">
          {workTypes.map((workType) => (
            <WorkTypeCard 
              key={workType.id}
              workType={workType}
              onPress={() => handleWorkTypeSelect(workType)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Work Type Card Component
const WorkTypeCard = ({ workType, onPress }) => {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200", 
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200"
  };

  const iconColorMap = {
    blue: "#6366f1",
    green: "#10b981", 
    purple: "#8b5cf6",
    orange: "#f59e0b"
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-[48%] p-6 rounded-2xl border-2 ${colorMap[workType.color]} mb-4`}
    >
      <View className="items-center">
        <View className={`p-3 rounded-xl mb-3 bg-white`}>
          <Ionicons name={workType.icon} size={24} color={iconColorMap[workType.color]} />
        </View>
        <Text className="text-lg font-bold text-gray-900 text-center mb-1">
          {workType.displayName}
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          {workType.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};