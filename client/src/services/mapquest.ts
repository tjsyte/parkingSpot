import { ParkingSpotClient } from "@shared/schema";

const MAPQUEST_API_KEY = "gdAUsDdppCIuVMM7LJSRE4e4Ujav96jU";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type DistanceMatrixResult = {
  distance: number; // in kilometers
  formattedDistance: string;
  duration: number; // in seconds
  formattedDuration: string;
};

// Initialize MapQuest map
export const initializeMap = (
  elementId: string,
  center: Coordinates = { lat: 14.5995, lng: 120.9842 }, // Default to Manila, Philippines
  zoom: number = 12
): L.Map => {
  if (!window.L) {
    throw new Error("MapQuest library not loaded");
  }

  window.L.mapquest.key = MAPQUEST_API_KEY;

  const map = window.L.mapquest.map(elementId, {
    center,
    layers: window.L.mapquest.tileLayer('map'),
    zoom
  });

  // Add map controls
  map.addControl(window.L.mapquest.control());

  return map;
};

// Add a marker to the map
export const addMarker = (
  map: L.Map,
  position: Coordinates,
  options: L.MarkerOptions = {}
): L.Marker => {
  return window.L.marker(position, options).addTo(map);
};

// Extended location type with accuracy information
export type LocationWithAccuracy = Coordinates & {
  accuracy: number;
};

// Default location - Metro Manila, Philippines
const DEFAULT_LOCATION: LocationWithAccuracy = {
  lat: 14.5995, 
  lng: 120.9842,
  accuracy: 5000
};

// Get current location using browser's Geolocation API with accuracy information
export const getCurrentLocation = (): Promise<LocationWithAccuracy> => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation ay hindi sinusuportahan ng iyong browser. Subukan ang ibang browser.";
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }
    
    console.log("Starting location lookup...");
    
    // First try to get a precise location with high accuracy
    // If it times out or fails, fallback to a less precise but faster method
    let hasResolved = false;
    let highAccuracyTimedOut = false;
    
    // Define error handler
    const handleError = (error: GeolocationPositionError) => {
      console.log(`Location error (${highAccuracyTimedOut ? 'low' : 'high'} accuracy attempt):`, error.code, error.message);
      
      // If high accuracy timed out, we're still waiting for low accuracy
      if (error.code === error.TIMEOUT && !highAccuracyTimedOut) {
        console.log("High accuracy location timed out, trying with low accuracy...");
        highAccuracyTimedOut = true;
        return; // Don't reject yet, wait for low accuracy attempt
      }
      
      // If we already got a position or we're in the low accuracy attempt, handle the error
      if (hasResolved || highAccuracyTimedOut) {
        let errorMessage = "Hindi mahanap ang iyong lokasyon. Subukan muli.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Hindi pinapayagan ang pag-access sa location. Pakibukas ang location permission sa iyong browser/device settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Hindi available ang impormasyon ng lokasyon. Subukan muli mamaya o i-check ang internet connection.";
            break;
          case error.TIMEOUT:
            errorMessage = "Nag-timeout ang pag-request ng lokasyon. Pakisuri ang iyong koneksyon at subukan muli.";
            break;
        }
        reject(new Error(errorMessage));
      }
    };
    
    // Define success handler
    const handleSuccess = (position: GeolocationPosition) => {
      if (hasResolved) return; // Don't resolve twice
      
      hasResolved = true;
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`✓ Successfully got location! Accuracy: ${accuracy.toFixed(1)} meters`);
      
      // Return location with accuracy information
      resolve({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy
      });
    };

    // Try first with highest possible accuracy - will use GPS on mobile devices
    console.log("Attempting to get location with high accuracy (GPS preferred)...");
    navigator.geolocation.getCurrentPosition(
      handleSuccess, 
      handleError,
      { 
        enableHighAccuracy: true, 
        timeout: 15000,    // 15 second timeout for high accuracy
        maximumAge: 0      // Always get a fresh position
      }
    );
    
    // If high accuracy takes too long, try with lower accuracy as fallback
    // This will typically use network-based location which is faster but less precise
    setTimeout(() => {
      if (!hasResolved) {
        console.log("High accuracy location taking too long, trying with lower accuracy...");
        highAccuracyTimedOut = true;
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleError,
          { 
            enableHighAccuracy: false, 
            timeout: 10000,     // 10 second timeout for low accuracy
            maximumAge: 60000   // Accept positions up to 1 minute old to speed things up
          }
        );
      }
    }, 8000); // Wait 8 seconds before trying the fallback
  });
};

// Calculate distance and time between two points
export const calculateDistanceMatrix = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceMatrixResult> => {
  const url = `https://www.mapquestapi.com/directions/v2/routematrix?key=${MAPQUEST_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      locations: [
        `${origin.lat},${origin.lng}`,
        `${destination.lat},${destination.lng}`
      ],
      options: {
        allToAll: false,
        unit: 'k' // kilometers
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to calculate distance matrix');
  }

  const data = await response.json();
  
  // MapQuest returns distance in the requested unit (kilometers)
  const distance = data.distance[1];
  const formattedDistance = `${distance.toFixed(1)} km`;
  
  // Time is in seconds
  const duration = data.time[1];
  const minutes = Math.ceil(duration / 60);
  const formattedDuration = `${minutes} min`;

  return {
    distance,
    formattedDistance,
    duration,
    formattedDuration
  };
};

// Get directions between two points
export const getDirections = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<void> => {
  const directionsLayer = window.L.mapquest.directionsLayer({
    directionsResponse: {
      route: {
        locations: [
          {
            latLng: origin
          },
          {
            latLng: destination
          }
        ]
      }
    },
    options: {
      draggable: false,
      routeRibbon: {
        showTraffic: true
      }
    }
  });

  window.L.mapquest.map('map', {
    center: [origin.lat, origin.lng],
    layers: [
      window.L.mapquest.tileLayer('map'),
      directionsLayer
    ],
    zoom: 12
  });
};

// Enhance parking spots with distance and duration from current location
export const enhanceParkingSpotsWithDistance = async (
  spots: ParkingSpotClient[],
  userLocation: Coordinates
): Promise<ParkingSpotClient[]> => {
  console.log("Starting enhanceParkingSpotsWithDistance with", spots.length, "spots");
  
  if (!spots || spots.length === 0) {
    console.log("No spots to process");
    return [];
  }
  
  if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    console.error("Invalid user location:", userLocation);
    return spots;
  }
  
  try {
    const enhancedSpots = await Promise.all(
      spots.map(async (spot, index) => {
        try {
          console.log(`Processing spot ${index+1}/${spots.length}: ${spot.name}`);
          
          const matrix = await calculateDistanceMatrix(
            userLocation,
            { lat: spot.latitude, lng: spot.longitude }
          );
          
          return {
            ...spot,
            distance: matrix.distance,
            duration: matrix.duration
          };
        } catch (error) {
          console.error("Error calculating distance for spot:", spot.id, error);
          return spot;
        }
      })
    );
    
    console.log("All spots processed. Sorting by distance...");
    
    // Sort by distance
    const sortedSpots = enhancedSpots.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    console.log("Spots sorted. Returning", sortedSpots.length, "enhanced spots");
    return sortedSpots;
  } catch (error) {
    console.error("Error in enhanceParkingSpotsWithDistance:", error);
    return spots;
  }
};

// Add MapQuest type definitions
declare global {
  interface Window {
    L: {
      mapquest: any;
      marker: (position: Coordinates, options?: L.MarkerOptions) => L.Marker;
      circle: (position: [number, number], options?: any) => any;
    };
  }
}
