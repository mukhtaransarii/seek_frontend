import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RideProvider } from './RideContext.tsx'
import MapViewComponents from './components/MapView.tsx'
import { useRide } from './RideContext.tsx'
import LocationPicker from './components/LocationPicker';
import TripSummary from './components/TripSummary';
import ConfirmTrip from './components/ConfirmTrip'

export default function BookRideMain() {
  const { currenLocation, step } = useRide()
 
  return (
      <View className="flex-1">
       <MapViewComponents />  
       
       {step === 1 &&  <LocationPicker /> }
       
       {step === 2 && <TripSummary /> }
      
       {step === 3 && <ConfirmTrip /> }
       
      </View>
  );
};
