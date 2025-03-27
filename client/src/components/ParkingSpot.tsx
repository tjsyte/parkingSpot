import { ParkingSpotClient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ParkingSpotProps {
  spot: ParkingSpotClient;
  onSelect: (spot: ParkingSpotClient) => void;
}

export default function ParkingSpot({ spot, onSelect }: ParkingSpotProps) {
  // Format hours display
  const formatHours = () => {
    if (spot.isOpen24Hours) return "24/7";
    if (spot.openingTime && spot.closingTime) {
      return `${spot.openingTime} - ${spot.closingTime}`;
    }
    return "Hours not specified";
  };

  // Format rate display
  const formatRate = () => {
    if (spot.pricePerHour) {
      return `${spot.currency}${spot.pricePerHour}/hour`;
    }
    return "Free";
  };

  // Determine status based on availability
  const getStatus = () => {
    if (spot.availableSpots === 0) return { text: "Full", color: "bg-red-100 text-red-800" };
    if (spot.availableSpots < 10) return { text: "Limited", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Available", color: "bg-green-100 text-green-800" };
  };

  const status = getStatus();

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{spot.name}</h3>
          <Badge className={`${status.color}`} variant="outline">
            {status.text}
          </Badge>
        </div>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <i className="fas fa-map-marker-alt text-gray-400 mr-1"></i>
          <span>{spot.address}</span>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <i className="fas fa-road text-gray-400 mr-1"></i>
            <span className="text-sm">{spot.distance ? `${spot.distance.toFixed(1)} km away` : "Distance unknown"}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-car text-gray-400 mr-1"></i>
            <span className="text-sm">{spot.availableSpots} spots left</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-tag text-gray-400 mr-1"></i>
            <span className="text-sm">{formatRate()}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-clock text-gray-400 mr-1"></i>
            <span className="text-sm">{formatHours()}</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button variant="outline" size="sm" className="text-primary bg-blue-50 hover:bg-blue-100">
            <i className="far fa-star mr-1"></i> Save
          </Button>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-blue-600"
            onClick={() => onSelect(spot)}
            disabled={spot.availableSpots === 0}
          >
            <i className="fas fa-directions mr-1"></i> Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
