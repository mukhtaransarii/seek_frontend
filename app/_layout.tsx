import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <Stack
            screenOptions={{
              headerShown: false,
              headerTransparent: true,
              headerTitle: "",
              headerShadowVisible: false,
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
  );
}
