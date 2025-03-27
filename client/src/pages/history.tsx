import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ParkingSpotList from "@/components/ParkingSpotList";
import ParkingSpotDetail from "@/components/ParkingSpotDetail";
import { ParkingSpotClient } from "@shared/schema";

export default function History() {
  const { isAuthenticated, user } = useAuth();
  const [historySpots, setHistorySpots] = useState<ParkingSpotClient[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotClient | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const historyKey = `ezpark_history_${user.uid}`;
      const historyData = localStorage.getItem(historyKey);
      if (historyData) {
        setHistorySpots(JSON.parse(historyData));
      }
    }
  }, [user]);

  const handleSpotSelect = (spot: ParkingSpotClient) => {
    setSelectedSpot(spot);
  };

  const handleCloseSpotDetail = () => {
    setSelectedSpot(null);
  };

  if (!isAuthenticated) {
    return null; // Redirect logic can be added here if needed
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        userName={user?.displayName || user?.email || "User"}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="border-b p-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <i className="fas fa-history text-primary mr-2"></i>
                  Your Parking History
                </h2>
              </div>
              
              <div className="h-[calc(100vh-16rem)] overflow-y-auto">
                <ParkingSpotList 
                  spots={historySpots}
                  showList={true}
                  onSpotSelect={handleSpotSelect}
                  isLoading={false} // Add isLoading prop
                  userLocation={null} // Add userLocation prop
                  emptyMessage="You have no parking history yet."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedSpot && (
        <ParkingSpotDetail 
          spot={selectedSpot} 
          onClose={handleCloseSpotDetail}
          userLocation={null} // Add userLocation prop
        />
      )}
    </div>
  );
}
