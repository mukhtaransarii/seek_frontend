import React from "react";
import { View, TextInput } from "react-native";

export default function SearchBar({ value, onChange }) {
  return (
    <View className="w-11/12 self-center bg-white rounded-full border border-gray-300 px-4">
      <TextInput
        placeholder="Search ally by name, skill or asset..."
        value={value}
        onChangeText={onChange}
        className="h-12 text-base"
        placeholderTextColor="#888"
      />
    </View>
  );
}
