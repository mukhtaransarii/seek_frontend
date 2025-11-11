import { Text, View } from "react-native";
import CustomHeader from '../../components/CustomHeader';

export default function profile() {
  return (
    <View className="bg-white">
      {/* Header */}
      <CustomHeader title="My Profile"/>
      <Text>hyyy im aziz from another branch</Text>
    </View>
  );
}
