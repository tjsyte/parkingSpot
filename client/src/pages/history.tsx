import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import ParkingSpotList from "@/components/ParkingSpotList";
import ParkingSpotDetail from "@/components/ParkingSpotDetail";
import { ParkingSpotClient } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Coordinates, getCurrentLocation } from "@/services/mapquest";

export default function History() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isOnHistoryPage] = useRoute("/history");
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotClient | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  
  // For now, we will use localStorage to track history
  // In a full implementation, this would come from the server
  const [historySpots, setHistorySpots] = useState<ParkingSpotClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load history from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      try {
        const historyKey = `ezpark_history_${user.uid}`;
        const historyData = localStorage.getItem(historyKey);
        
        if (historyData) {
          const parsedHistory = JSON.parse(historyData);
          setHistorySpots(parsedHistory);
        }
      } catch (error) {
        console.error("Error loading history data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user]);

  // Try to get user location for distance calculation
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Error getting location:", error);
        // Don't show an error toast here - location is optional for history view
      }
    };

    detectLocation();
  }, []);

  // Handle selecting a parking spot
  const handleSpotSelect = (spot: ParkingSpotClient) => {
    setSelectedSpot(spot);
  };

  // Handle closing the spot detail modal
  const handleCloseSpotDetail = () => {
    setSelectedSpot(null);
  };

  // Handle switching to map view
  const handleShowMap = () => {
    navigate("/map");
  };

  if (!isAuthenticated) {
    return null; // This will redirect to login via the useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        userName={user?.displayName || user?.email || "User"}
        onShowMapClick={handleShowMap}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow-sm rounded-lg">
              {/* Header with Title */}
              <div className="border-b p-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <i className="fas fa-history text-primary mr-2"></i>
                  Recently Viewed Parking Spots
                </h2>
              </div>
              
              <div className="h-[calc(100vh-16rem)] overflow-y-auto">
                <ParkingSpotList 
                  spots={historySpots}
                  showList={true}
                  onSpotSelect={handleSpotSelect}
                  isLoading={isLoading}
                  userLocation={userLocation}
                  emptyMessage="You haven't viewed any parking spots yet. Explore the map to view parking spots and they will appear in your history."
                />
              </div>
              
              {/* Status Info Bar */}
              <div className="p-3 border-t">
                <div className="text-sm text-center">
                  <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <i className="fas fa-history mr-1"></i>
                    <span>Your parking history • {historySpots.length} viewed spots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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