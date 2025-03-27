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
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Coordinates,
  initializeMap,
  getCurrentLocation,
  addMarker,
  enhanceParkingSpotsWithDistance
} from "@/services/mapquest";

// L namespace and Window interface are defined in types/mapquest.d.ts

export default function Map() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const [showParkingList, setShowParkingList] = useState<boolean>(true);
  const [showMapDialog, setShowMapDialog] = useState<boolean>(false);
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

  // Initialize map when dialog opens
  useEffect(() => {
    if (showMapDialog && !mapRef.current) {
      // Short delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        try {
          mapRef.current = initializeMap('map');
          
          // If we have user location, set the map view and add marker
          if (userLocation) {
            mapRef.current?.setView([userLocation.lat, userLocation.lng], 14);
            
            // Add user marker
            addMarker(mapRef.current, userLocation, {
              icon: window.L.mapquest.icons.circle({
                primaryColor: '#3B82F6'
              }),
              title: "Your Location"
            });
            
            // Process parking spots if available
            if (parkingSpots && Array.isArray(parkingSpots) && parkingSpots.length > 0) {
              parkingSpots.forEach((spot: ParkingSpotClient) => {
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
                  setShowMapDialog(false);
                });
              });
            }
          }
        } catch (error) {
          console.error("Error initializing map:", error);
          toast({
            title: "Map Error",
            description: "Failed to initialize map. Please try again later.",
            variant: "destructive"
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Cleanup map when dialog closes
    if (!showMapDialog && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [showMapDialog, userLocation, parkingSpots, toast]);

  // Reference to track the user marker
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  // State for location permission dialog
  const [showLocationHelpDialog, setShowLocationHelpDialog] = useState<boolean>(false);
  
  // Handle getting current location with improved accuracy and error handling
  const handleGetCurrentLocation = async () => {
    try {
      toast({
        title: "Hinahanap ang lokasyon...",
        description: "Naglo-load ang iyong kasalukuyang lokasyon. Pakipayagan ang location sharing.",
      });
      
      // Clear any existing user marker
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Get current location with required high accuracy
      const location = await getCurrentLocation();
      
      // Store location for use in other parts of the app
      setUserLocation(location);
      
      // Check accuracy and show appropriate message
      const accuracyMessage = location.accuracy > 1000 
        ? "Ang lokasyon mo ay hindi masyadong tumpak. Pakitingnan ang GPS settings."
        : "Nakuha ang iyong lokasyon!";

      if (mapRef.current) {
        // Smoothly animate to the user's location with enhanced zoom
        mapRef.current.setView([location.lat, location.lng], 15, {
          animate: true,
          duration: 1.0
        });
        
        // Create a pulsing effect for user location marker
        const pulsingIcon = window.L.mapquest.icons.circle({
          primaryColor: '#3B82F6',
          secondaryColor: '#60A5FA',
          size: 15,
          shadowSize: 50,
          shadowAnchor: [5, 5]
        });
        
        // Add user marker and store reference
        userMarkerRef.current = addMarker(mapRef.current, location, {
          icon: pulsingIcon,
          title: "Iyong Lokasyon",
          zIndexOffset: 1000 // Keep user marker on top
        });
        
        // Use the actual accuracy from the GPS as the radius of the circle
        // This helps users understand how accurate their location is
        try {
          const accuracyCircle = window.L.circle([location.lat, location.lng], {
            radius: Math.min(location.accuracy, 1000), // Cap at 1km for visual purposes
            weight: 1,
            color: '#3B82F6',
            fillColor: '#93C5FD',
            fillOpacity: 0.15
          }).addTo(mapRef.current);
        } catch (err) {
          console.error("Error adding accuracy circle:", err);
        }
        
        // Show success toast with accuracy information
        toast({
          title: location.accuracy > 1000 
            ? "Nakuha ang lokasyon mo (mababang accuracy)" 
            : "Nakuha ang lokasyon mo!",
          description: location.accuracy > 1000
            ? `Ang accuracy ay mababa (${(location.accuracy/1000).toFixed(1)}km). Para sa mas magandang resulta, i-ON ang GPS at location services.`
            : `Ang lokasyon mo ay tumpak hanggang ${location.accuracy.toFixed(0)} metro.`,
          variant: location.accuracy > 1000 ? "default" : "default"
        });
        
        // Process parking spots if available
        if (parkingSpots && Array.isArray(parkingSpots) && parkingSpots.length > 0) {
          // Show loading toast for spots
          toast({
            title: "Naghahanap ng parking spots...",
            description: "Kinakalkula ang distansya sa mga parking spot...",
          });
          
          const enhanced = await enhanceParkingSpotsWithDistance(parkingSpots as ParkingSpotClient[], location);
          setEnhancedSpots(enhanced);

          // Clear existing markers and add new ones
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

            // Add click event to marker with enhanced info
            marker.on('click', () => {
              setSelectedSpot(spot);
              
              // If in map dialog, close it to show spot details
              if (showMapDialog) {
                setShowMapDialog(false);
              }
            });
            
            // Add popup with basic info
            marker.bindPopup(`
              <div class="text-center">
                <strong>${spot.name}</strong><br/>
                <span class="text-sm">${spot.availableSpots} slots available</span><br/>
                <span class="text-xs">${spot.distance?.toFixed(1) || '?'} km away</span>
              </div>
            `);
          });

          toast({
            title: "Nakakita ng Parking Spots!",
            description: `Nakakita ng ${enhanced.length} parking spots malapit sa iyo`,
            variant: "default"
          });
        }
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      
      // Show a more detailed toast message
      toast({
        title: "Hindi ma-access ang lokasyon",
        description: "May problema sa pag-access ng iyong lokasyon. Tingnan ang Location Help para sa tulong.",
        variant: "destructive",
        action: <Button variant="outline" onClick={() => setShowLocationHelpDialog(true)}>Location Help</Button>
      });
      
      // Show the location help dialog
      setShowLocationHelpDialog(true);
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
      <main className="flex-1 flex flex-col p-4 h-[calc(100%-4rem)]">
        {/* Parking Spots Component (Default View) */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Open Map Button */}
          <div className="mb-6 flex justify-center">
            <Button 
              onClick={() => setShowMapDialog(true)}
              className="bg-primary hover:bg-blue-600 text-white py-2 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 w-full md:w-auto"
              size="lg"
            >
              <i className="fas fa-map-marked-alt text-lg"></i>
              <span>Open Map View</span>
            </Button>
          </div>

          {/* Parking Spots Card with Title */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-primary text-white">
              <h2 className="text-xl font-semibold flex items-center">
                <i className="fas fa-parking mr-2"></i>
                Available Parking Spots
              </h2>
              <p className="text-sm opacity-90 mt-1">Find parking spots near you</p>
            </div>
            
            <div className="h-[calc(100vh-16rem)] overflow-y-auto">
              <ParkingSpotList 
                spots={enhancedSpots}
                showList={true}
                onSpotSelect={handleSpotSelect}
                isLoading={isLoading || !userLocation}
                userLocation={userLocation}
              />
            </div>
            
            {/* Bottom Action Bar */}
            <div className="p-4 border-t flex flex-col sm:flex-row gap-2 justify-between">
              <div className="text-sm text-gray-600">
                {userLocation ? (
                  <div className="flex items-center">
                    <i className="fas fa-map-marker-alt text-primary mr-1"></i>
                    <span>Your location is set</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <i className="fas fa-exclamation-circle text-yellow-500 mr-1"></i>
                    <span>Location not set</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleGetCurrentLocation}
                variant="outline"
                className="text-primary border-primary"
              >
                <i className="fas fa-location-arrow mr-1"></i>
                Get My Location
              </Button>
            </div>
          </div>
        </div>

        {/* Map Dialog (Fullscreen) */}
        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
          <DialogContent className="max-w-full w-full h-full max-h-screen p-0 border-none bg-transparent">
            <div className="h-screen w-full flex flex-col bg-white">
              {/* Map Header */}
              <div className="bg-primary text-white p-2 flex justify-between items-center z-20">
                <h2 className="text-lg font-semibold flex items-center">
                  <i className="fas fa-map-marked-alt mr-2"></i>
                  EzPark Connect Map
                </h2>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-white hover:bg-blue-600" 
                  onClick={() => setShowMapDialog(false)}
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
              
              {/* Map Container */}
              <div className="relative flex-1">
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

                {/* Floating Controls Container */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-full w-full flex flex-col justify-between p-4">
                    {/* Top Controls Row */}
                    <div className="w-full flex justify-end">
                      {/* Map Controls */}
                      <div className="pointer-events-auto flex flex-col space-y-2 bg-white bg-opacity-80 p-2 rounded-lg shadow-lg">
                        <button 
                          onClick={handleZoomIn}
                          className="h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <i className="fas fa-plus text-gray-600"></i>
                        </button>
                        <button 
                          onClick={handleZoomOut}
                          className="h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <i className="fas fa-minus text-gray-600"></i>
                        </button>
                      </div>
                    </div>
                    
                    {/* Bottom Controls Row */}
                    <div className="w-full flex justify-between items-center">
                      {/* List Button */}
                      <Button 
                        className="pointer-events-auto bg-white text-primary hover:bg-gray-100 shadow-lg"
                        onClick={() => setShowMapDialog(false)}
                        title="Show Parking Spots List"
                      >
                        <i className="fas fa-list mr-2"></i>
                        <span className="hidden sm:inline">Show List</span>
                      </Button>
                      
                      {/* Current Location Button */}
                      <button 
                        onClick={handleGetCurrentLocation}
                        className="pointer-events-auto h-14 w-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all duration-300 border-2 border-white"
                        title="Get Your Current Location"
                      >
                        <i className="fas fa-location-arrow text-xl"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
      
      {/* Location Help Dialog */}
      <Dialog open={showLocationHelpDialog} onOpenChange={setShowLocationHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <i className="fas fa-location-arrow text-primary"></i>
            Location Sharing Help
          </DialogTitle>
          <DialogDescription>
            Kelangan ng EzPark Connect ng access sa iyong location para makahanap ng mga parking spots malapit sa iyo.
          </DialogDescription>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-primary">Bakit hindi gumagana ang Location Sharing?</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hindi mo pa pinagana ang Location sharing sa browser</li>
                <li>Hindi aktibo ang GPS mo sa phone o device</li>
                <li>May problema sa internet connection</li>
                <li>Nasa loob ka ng gusali o area na may mahina GPS</li>
              </ul>
            </div>
            
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <h3 className="font-medium text-lg text-primary">Paano i-enable ang Location:</h3>
              <div className="rounded-lg bg-slate-50 p-4 space-y-4">
                <div>
                  <h4 className="font-semibold">Sa Android:</h4>
                  <ol className="list-decimal pl-5">
                    <li>Buksan ang <strong>Settings</strong></li>
                    <li>Pumunta sa <strong>Privacy</strong> o <strong>Location</strong></li>
                    <li>I-ON ang <strong>Location services</strong></li>
                    <li>Tingnan ang browser settings para sa permissions</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold">Sa iPhone:</h4>
                  <ol className="list-decimal pl-5">
                    <li>Buksan ang <strong>Settings</strong></li>
                    <li>Pumunta sa <strong>Privacy & Security</strong></li>
                    <li>Piliin ang <strong>Location Services</strong> at i-ON</li>
                    <li>Hanapin ang browser mo at piliin ang <strong>While Using</strong></li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold">Sa Browser:</h4>
                  <ol className="list-decimal pl-5">
                    <li>Tingnan ang address bar para sa location icon</li>
                    <li>I-click ito at piliin na <strong>Allow</strong></li>
                    <li>Refresh ang page pagkatapos mag-allow</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setShowLocationHelpDialog(false)}>Close</Button>
            <Button onClick={handleGetCurrentLocation}>Try Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
