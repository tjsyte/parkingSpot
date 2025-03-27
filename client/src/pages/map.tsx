import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ParkingSpotClient } from "@shared/schema";
import Header from "@/components/Header";
import ParkingSpotList from "@/components/ParkingSpotList";
import ParkingSpotDetail from "@/components/ParkingSpotDetail";
import {
  Coordinates,
  initializeMap,
  getCurrentLocation,
  addMarker,
  enhanceParkingSpotsWithDistance
} from "@/services/mapquest";

export default function Map() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const [showParkingList, setShowParkingList] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotClient | null>(null);
  const [enhancedSpots, setEnhancedSpots] = useState<ParkingSpotClient[]>([]);

  // Fetch parking spots from the API
  const { data: parkingSpots, isLoading, error } = useQuery({
    queryKey: ['/api/parking-spots'],
  });

  // Check if user is authenticated, redirect if not
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapRef.current) {
      try {
        mapRef.current = initializeMap('map');
      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map Error",
          description: "Failed to initialize map. Please try again later.",
          variant: "destructive"
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [toast]);

  // Handle getting current location
  const handleGetCurrentLocation = async () => {
    try {
      toast({
        title: "Getting location",
        description: "Finding your current location...",
      });

      const location = await getCurrentLocation();
      setUserLocation(location);

      if (mapRef.current) {
        mapRef.current.setView([location.lat, location.lng], 14);
        
        // Add user marker
        addMarker(mapRef.current, location, {
          icon: window.L.mapquest.icons.circle({
            primaryColor: '#3B82F6'
          }),
          title: "Your Location"
        });

        // Process parking spots if available
        if (parkingSpots && parkingSpots.length > 0) {
          const enhanced = await enhanceParkingSpotsWithDistance(parkingSpots, location);
          setEnhancedSpots(enhanced);

          // Add markers for parking spots
          enhanced.forEach(spot => {
            const isAvailable = spot.availableSpots > 0;
            
            const marker = addMarker(
              mapRef.current!,
              { lat: spot.latitude, lng: spot.longitude },
              {
                icon: window.L.mapquest.icons.marker({
                  primaryColor: isAvailable ? '#10B981' : '#EF4444',
                  secondaryColor: '#FFFFFF',
                  symbol: 'P'
                }),
                title: spot.name
              }
            );

            // Add click event to marker
            marker.on('click', () => {
              setSelectedSpot(spot);
            });
          });

          toast({
            title: "Spots Found",
            description: `Found ${enhanced.length} parking spots near you`,
            variant: "default"
          });
        }
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      toast({
        title: "Location Error",
        description: error.message || "Failed to get your location",
        variant: "destructive"
      });
    }
  };

  // Toggle parking list on mobile
  const toggleParkingList = () => {
    setShowParkingList(!showParkingList);
  };

  // Handle spot selection
  const handleSpotSelect = (spot: ParkingSpotClient) => {
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.setView([spot.latitude, spot.longitude], 15);
    }
  };

  // Close spot detail modal
  const handleCloseSpotDetail = () => {
    setSelectedSpot(null);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <Header userName={user?.displayName || user?.email || "User"} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col sm:flex-row h-[calc(100%-4rem)]">
        {/* Map Container */}
        <div className="relative flex-1 h-full bg-gray-100">
          {/* Map */}
          <div id="map" className="h-full w-full">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center z-10">
                <div className="text-center">
                  <i className="fas fa-circle-notch fa-spin text-4xl text-primary mb-2"></i>
                  <p className="text-gray-700">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button 
              onClick={handleZoomIn}
              className="h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100"
            >
              <i className="fas fa-plus text-gray-600"></i>
            </button>
            <button 
              onClick={handleZoomOut}
              className="h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100"
            >
              <i className="fas fa-minus text-gray-600"></i>
            </button>
          </div>

          {/* Current Location Button */}
          <button 
            onClick={handleGetCurrentLocation}
            className="absolute bottom-28 sm:bottom-8 right-4 h-12 w-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600"
          >
            <i className="fas fa-location-arrow"></i>
          </button>

          {/* Mobile Parking List Toggle Button */}
          <button 
            onClick={toggleParkingList}
            className="sm:hidden absolute bottom-8 right-4 h-12 w-12 bg-white text-primary rounded-full shadow-lg flex items-center justify-center"
          >
            <i className="fas fa-list"></i>
          </button>
        </div>

        {/* Parking Spots List */}
        <ParkingSpotList 
          spots={enhancedSpots}
          showList={showParkingList}
          onSpotSelect={handleSpotSelect}
          isLoading={isLoading}
          userLocation={userLocation}
        />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden bg-white border-t fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around">
          <a href="#" className="flex flex-col items-center py-2 px-3 text-primary">
            <i className="fas fa-map-marked-alt text-xl"></i>
            <span className="text-xs mt-1">Map</span>
          </a>
          <a href="#" className="flex flex-col items-center py-2 px-3 text-gray-500">
            <i className="far fa-star text-xl"></i>
            <span className="text-xs mt-1">Favorites</span>
          </a>
          <a href="#" className="flex flex-col items-center py-2 px-3 text-gray-500">
            <i className="fas fa-history text-xl"></i>
            <span className="text-xs mt-1">History</span>
          </a>
          <a href="#" className="flex flex-col items-center py-2 px-3 text-gray-500">
            <i className="fas fa-user text-xl"></i>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>

      {/* Parking Spot Detail Modal */}
      {selectedSpot && (
        <ParkingSpotDetail 
          spot={selectedSpot} 
          onClose={handleCloseSpotDetail}
          userLocation={userLocation}
        />
      )}
    </div>
  );
}
