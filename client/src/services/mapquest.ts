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

// Get current location using browser's Geolocation API
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
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
  const enhancedSpots = await Promise.all(
    spots.map(async (spot) => {
      try {
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
  
  // Sort by distance
  return enhancedSpots.sort((a, b) => (a.distance || 999) - (b.distance || 999));
};

// Add MapQuest type definitions
declare global {
  interface Window {
    L: {
      mapquest: any;
      marker: (position: Coordinates, options?: L.MarkerOptions) => L.Marker;
    };
  }
}
