import { useState } from "react";
import { ParkingSpotClient } from "@shared/schema";
import ParkingSpot from "./ParkingSpot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "availability">("distance");

  // Filter spots based on search term
  const filteredSpots = spots.filter(spot => 
    spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spot.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort spots based on selected criteria
  const sortedSpots = [...filteredSpots].sort((a, b) => {
    if (sortBy === "distance") {
      return (a.distance || 999) - (b.distance || 999);
    } else {
      return b.availableSpots - a.availableSpots;
    }
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Toggle sort method
  const toggleSort = (sort: "distance" | "availability") => {
    setSortBy(sort);
  };

  return (
    <div 
      className={`
        ${showList ? "block" : "hidden"} 
        sm:block h-full sm:w-80 lg:w-96 bg-white shadow-xl overflow-y-auto
        scrollbar-hide rounded-r-lg
        ${showList && !userLocation ? "absolute inset-0 z-20" : ""}
      `}
    >
      <div className="sticky top-0 bg-white z-10 p-4 pb-2 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search parking spots..."
            className="pl-10 pr-4"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{sortedSpots.length} spots found</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant={sortBy === "distance" ? "default" : "outline"}
              size="sm" 
              className="text-xs px-2 py-1"
              onClick={() => toggleSort("distance")}
            >
              Sort by Distance
            </Button>
            <Button 
              variant={sortBy === "availability" ? "default" : "outline"}
              size="sm" 
              className="text-xs px-2 py-1"
              onClick={() => toggleSort("availability")}
            >
              Sort by Availability
            </Button>
          </div>
        </div>
      </div>

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
