import { Stack } from "expo-router";
import { RideProvider } from './RideContext';

export default function BookRideLayout() {
  return (
    <RideProvider>
      <Stack screenOptions={{ headerShown: false }}/>
    </RideProvider>
  );
}
