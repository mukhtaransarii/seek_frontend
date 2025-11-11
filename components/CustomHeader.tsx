import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomHeader({ title, onBack, onMenu }) {
  return (
    <View className="w-full flex-row items-center justify-center py-4 bg-white border-b border-gray-100">
      {/* Back Button */}
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          className="absolute left-4 p-2"
        >
         <Ionicons name="chevron-back" size={24} color="#6366f1" />
        </TouchableOpacity>
      )}

      {/* Title - Always Centered */}
      <Text className="text-xl font-semibold text-gray-900">{title}</Text>

      {/* Menu Button */}
      {onMenu && (
        <TouchableOpacity
          onPress={onMenu}
          className="absolute right-4 p-2"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  );
}