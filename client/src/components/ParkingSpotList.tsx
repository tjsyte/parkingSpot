import { useState } from "react";
import { ParkingSpotClient } from "@shared/schema";
import ParkingSpot from "./ParkingSpot";
import { Coordinates } from "@/services/mapquest";

interface ParkingSpotListProps {
  spots: ParkingSpotClient[];
  showList: boolean;
  onSpotSelect: (spot: ParkingSpotClient) => void;
  isLoading: boolean;
  userLocation: Coordinates | null;
}

export default function ParkingSpotList({ 
  spots, 
  showList, 
  onSpotSelect, 
  isLoading,
  userLocation
}: ParkingSpotListProps) {
  // Sort spots by distance automatically
  const sortedSpots = [...spots].sort((a, b) => {
    return (a.distance || 999) - (b.distance || 999);
  });

  return (
    <div className="h-full w-full bg-white overflow-y-auto">
      {/* Simple divider for visual separation */}
      <div className="h-2 border-b"></div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : !userLocation ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <i className="fas fa-location-arrow text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Click the location button to find parking spots near you</p>
          </div>
        ) : sortedSpots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <i className="fas fa-parking text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No parking spots found nearby</p>
          </div>
        ) : (
          sortedSpots.map(spot => (
            <ParkingSpot
              key={spot.id}
              spot={spot}
              onSelect={onSpotSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
