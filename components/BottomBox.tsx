import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight } = Dimensions.get('window');

export default function BottomBox({ 
  children,
  collapsedView, // ✅ New prop for collapsed content
  expandedView,  // ✅ New prop for expanded content
  collapsedHeight = 100,
  expandedHeight = screenHeight * 0.7,
  defaultCollapsed = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View 
      className="absolute left-4 right-4 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50"
      style={{ 
        bottom: isKeyboardVisible ? 20 : 10,
        height: isCollapsed ? collapsedHeight : expandedHeight,
      }}
    >
      {/* Collapse Handle */}
      <TouchableOpacity
        onPress={toggleCollapse}
        className="absolute -top-[10px] left-0 right-0 items-center z-10"
      >
        <View className="bg-white w-8 h-8 rounded-full justify-center items-center border border-gray-200">
          <Ionicons 
            name={isCollapsed ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#374151" 
          />
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isCollapsed ? (
        // Collapsed View
        <View className="flex-1 p-4">
          {collapsedView}
        </View>
      ) : (
        // Expanded View - Scrollable
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            flexGrow: 1,
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {expandedView}
        </ScrollView>
      )}
    </View>
  );
}