import { useEffect, useState } from "react";
import { ParkingSpotClient } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coordinates, calculateDistanceMatrix } from "@/services/mapquest";

interface ParkingSpotDetailProps {
  spot: ParkingSpotClient;
  onClose: () => void;
  userLocation: Coordinates | null;
}

export default function ParkingSpotDetail({ 
  spot, 
  onClose,
  userLocation 
}: ParkingSpotDetailProps) {
  const [eta, setEta] = useState<string>("--");

  // Calculate ETA when component mounts
  useEffect(() => {
    const calculateEta = async () => {
      if (!userLocation) return;
      
      try {
        const matrix = await calculateDistanceMatrix(
          userLocation,
          { lat: spot.latitude, lng: spot.longitude }
        );
        
        setEta(matrix.formattedDuration);
      } catch (error) {
        console.error("Error calculating ETA:", error);
        setEta("Unknown");
      }
    };

    calculateEta();
  }, [spot, userLocation]);

  // Get status based on availability
  const getStatus = () => {
    if (spot.availableSpots === 0) return { text: "Full", color: "bg-red-100 text-red-800" };
    if (spot.availableSpots < 10) return { text: "Limited", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Available", color: "bg-green-100 text-green-800" };
  };

  const status = getStatus();

  // Format rate display
  const formatRate = () => {
    if (spot.pricePerHour) {
      return `${spot.currency}${spot.pricePerHour}/hour`;
    }
    return "Free";
  };

  // Format hours display
  const formatHours = () => {
    if (spot.isOpen24Hours) return "24/7";
    if (spot.openingTime && spot.closingTime) {
      return `${spot.openingTime} - ${spot.closingTime}`;
    }
    return "Hours not specified";
  };

  // Handle get directions
  const handleGetDirections = () => {
    if (!userLocation) return;
    
    // Open directions in a new tab using MapQuest
    const url = `https://www.mapquest.com/directions/to/${spot.latitude},${spot.longitude}/from/${userLocation.lat},${userLocation.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {spot.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* Status and Address */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <i className="fas fa-map-marker-alt text-gray-500 mr-2"></i>
            <span className="text-gray-700">{spot.address}</span>
          </div>
          <Badge className={`${status.color}`} variant="outline">
            {status.text}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Distance</div>
            <div className="font-medium flex items-center">
              <i className="fas fa-road text-primary mr-2"></i>
              <span>{spot.distance ? `${spot.distance.toFixed(1)} km` : "Unknown"}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Availability</div>
            <div className="font-medium flex items-center">
              <i className="fas fa-car text-primary mr-2"></i>
              <span>{spot.availableSpots} spots left</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Rate</div>
            <div className="font-medium flex items-center">
              <i className="fas fa-tag text-primary mr-2"></i>
              <span>{formatRate()}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Hours</div>
            <div className="font-medium flex items-center">
              <i className="fas fa-clock text-primary mr-2"></i>
              <span>{formatHours()}</span>
            </div>
          </div>
        </div>

        {/* Estimated Time of Arrival */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Estimated Time of Arrival</h4>
              <p className="text-sm text-gray-600 mt-1">Based on current traffic conditions</p>
            </div>
            <div className="text-2xl font-bold text-primary">{eta}</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center text-sm">
              <i className={`fas fa-shield-alt mr-2 ${spot.features.hasSecurityGuard ? 'text-green-500' : 'text-gray-400'}`}></i>
              <span>24/7 Security</span>
            </div>
            <div className="flex items-center text-sm">
              <i className={`fas fa-credit-card mr-2 ${spot.features.hasCardPayment ? 'text-green-500' : 'text-gray-400'}`}></i>
              <span>Card Payment</span>
            </div>
            <div className="flex items-center text-sm">
              <i className={`fas fa-wheelchair mr-2 ${spot.features.hasAccessibleParking ? 'text-green-500' : 'text-gray-400'}`}></i>
              <span>Accessible Parking</span>
            </div>
            <div className="flex items-center text-sm">
              <i className={`fas fa-charging-station mr-2 ${spot.features.hasEvCharging ? 'text-green-500' : 'text-gray-400'}`}></i>
              <span>EV Charging</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-blue-50 hover:bg-blue-100">
            <i className="far fa-star mr-1"></i> Save as Favorite
          </Button>
          <Button 
            onClick={handleGetDirections}
            disabled={!userLocation || spot.availableSpots === 0}
          >
            <i className="fas fa-directions mr-1"></i> Get Directions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
