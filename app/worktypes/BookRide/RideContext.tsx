import { createContext, useState, useContext } from 'react';

const RideContext = createContext();

export const RideProvider = ({ children }) => {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [vehicleType, setVehicleType] = useState('sedan');
  const [step, setStep] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [fare, setFare] = useState(null);
  
  console.log("pickup", pickup)
  console.log("drop", drop)
  console.log("distance", distance)
  console.log("eta", eta)
  console.log("vehicleType", vehicleType)
  console.log("step", step)
  console.log("currentLocation", currentLocation)
  
  return (
    <RideContext.Provider
      value={{
        pickup, setPickup,
        drop, setDrop,
        distance, setDistance,
        eta, setEta,
        vehicleType, setVehicleType,
        step, setStep,
        currentLocation, setCurrentLocation,
        fare, setFare
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => useContext(RideContext);