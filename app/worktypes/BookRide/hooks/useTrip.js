import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRide } from "../RideContext";

const socket = io("http://localhost:5000");

export function useTrip() {
  const { vehicleType, pickup, drop, distance, eta, fare } = useRide();
  const [tripId, setTripId] = useState(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [driver, setDriver] = useState(null);

  const confirmTrip = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/trip/confirm", {
        userId,
        pickup,
        drop,
        distance,
        eta,
        vehicleType,
        fare: fare[vehicleType]
      });
      setTripId(res.data._id);
      setTripStatus(res.data.status);
      socket.emit("new_trip", { tripId: res.data._id });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    socket.on("trip_update", (data) => {
      if (data.tripId === tripId) {
        setTripStatus(data.status);
        setDriver(data.driver || null);
      }
    });

    return () => socket.off("trip_update");
  }, [tripId]);

  return { confirmTrip, tripStatus, driver, fare, vehicleType };
}
