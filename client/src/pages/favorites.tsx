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

export default function Favorites() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isOnFavoritesPage] = useRoute("/favorites");
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotClient | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Get user's favorites
  const { data: favoriteSpots, isLoading, error } = useQuery({
    queryKey: ['/api/favorites', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      try {
        // First, get the user ID from the backend using the Firebase UID
        const userResponse = await fetch(`/api/users/uid/${user.uid}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        
        // Now get the favorites using the user ID
        const favoritesResponse = await fetch(`/api/favorites/${userData.id}`);
        if (!favoritesResponse.ok) {
          throw new Error('Failed to fetch favorites');
        }
        return favoritesResponse.json();
      } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
    },
    enabled: isAuthenticated && Boolean(user?.uid)
  });

  // Try to get user location for distance calculation
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Error getting location:", error);
        // Don't show an error toast here - location is optional for favorites view
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
                  <i className="far fa-star text-primary mr-2"></i>
                  Your Favorite Parking Spots
                </h2>
              </div>
              
              <div className="h-[calc(100vh-16rem)] overflow-y-auto">
                <ParkingSpotList 
                  spots={favoriteSpots || []}
                  showList={true}
                  onSpotSelect={handleSpotSelect}
                  isLoading={isLoading}
                  userLocation={userLocation}
                  emptyMessage="You haven't added any favorites yet. Find parking spots on the map and add them to your favorites."
                />
              </div>
              
              {/* Status Info Bar */}
              <div className="p-3 border-t">
                <div className="text-sm text-center">
                  <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <i className="far fa-star mr-1"></i>
                    <span>Your favorite parking spots • {(Array.isArray(favoriteSpots) ? favoriteSpots.length : 0)} saved spots</span>
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