import { 
  User, 
  ParkingSpot, 
  Favorite, 
  InsertUser, 
  InsertParkingSpot, 
  InsertFavorite 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Parking spot methods
  getParkingSpot(id: number): Promise<ParkingSpot | undefined>;
  getAllParkingSpots(): Promise<ParkingSpot[]>;
  getParkingSpotsByLocation(lat: number, lng: number, radius: number): Promise<ParkingSpot[]>;
  createParkingSpot(spot: InsertParkingSpot): Promise<ParkingSpot>;
  updateParkingSpotAvailability(id: number, availableSpots: number): Promise<ParkingSpot | undefined>;
  
  // Favorites methods
  getUserFavorites(userId: number): Promise<ParkingSpot[]>;
  addFavorite(userId: number, parkingSpotId: number): Promise<Favorite>;
  removeFavorite(id: number): Promise<void>;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private parkingSpots: Map<number, ParkingSpot>;
  private favorites: Map<number, Favorite>;
  private currentUserId: number;
  private currentParkingSpotId: number;
  private currentFavoriteId: number;

  constructor() {
    this.users = new Map();
    this.parkingSpots = new Map();
    this.favorites = new Map();
    this.currentUserId = 1;
    this.currentParkingSpotId = 1;
    this.currentFavoriteId = 1;
    
    // Initialize with sample parking spots in the Philippines
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uid === uid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      uid: insertUser.uid || null,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      provider: insertUser.provider || null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Parking spot methods
  async getParkingSpot(id: number): Promise<ParkingSpot | undefined> {
    return this.parkingSpots.get(id);
  }

  async getAllParkingSpots(): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values());
  }

  async getParkingSpotsByLocation(lat: number, lng: number, radius: number): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values()).filter(spot => {
      const distance = calculateDistance(lat, lng, spot.latitude, spot.longitude);
      return distance <= radius;
    });
  }

  async createParkingSpot(insertSpot: InsertParkingSpot): Promise<ParkingSpot> {
    const id = this.currentParkingSpotId++;
    const spot: ParkingSpot = { 
      ...insertSpot, 
      id,
      pricePerHour: insertSpot.pricePerHour || null,
      currency: insertSpot.currency || null,
      isOpen24Hours: insertSpot.isOpen24Hours || null,
      openingTime: insertSpot.openingTime || null,
      closingTime: insertSpot.closingTime || null,
      hasSecurityGuard: insertSpot.hasSecurityGuard || null,
      hasCardPayment: insertSpot.hasCardPayment || null,
      hasAccessibleParking: insertSpot.hasAccessibleParking || null,
      hasEvCharging: insertSpot.hasEvCharging || null
    };
    this.parkingSpots.set(id, spot);
    return spot;
  }

  async updateParkingSpotAvailability(id: number, availableSpots: number): Promise<ParkingSpot | undefined> {
    const spot = this.parkingSpots.get(id);
    
    if (!spot) return undefined;
    
    const updatedSpot: ParkingSpot = {
      ...spot,
      availableSpots
    };
    
    this.parkingSpots.set(id, updatedSpot);
    return updatedSpot;
  }

  // Favorites methods
  async getUserFavorites(userId: number): Promise<ParkingSpot[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(
      fav => fav.userId === userId
    );
    
    const favoriteSpots: ParkingSpot[] = [];
    
    for (const favorite of userFavorites) {
      const spot = this.parkingSpots.get(favorite.parkingSpotId);
      if (spot) favoriteSpots.push(spot);
    }
    
    return favoriteSpots;
  }

  async addFavorite(userId: number, parkingSpotId: number): Promise<Favorite> {
    // Check if already favorited
    const existing = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.parkingSpotId === parkingSpotId
    );
    
    if (existing) return existing;
    
    const id = this.currentFavoriteId++;
    const createdAt = new Date();
    
    const favorite: Favorite = {
      id,
      userId,
      parkingSpotId,
      createdAt
    };
    
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(id: number): Promise<void> {
    this.favorites.delete(id);
  }

  // Initialize with sample parking spots
  private initializeSampleData() {
    // Sample parking spots in Metro Manila, Philippines
    const sampleSpots: InsertParkingSpot[] = [
      {
        name: "SM Mall Parking",
        address: "123 Ayala Avenue, Makati City",
        latitude: 14.5547,
        longitude: 121.0244,
        totalSpots: 100,
        availableSpots: 45,
        pricePerHour: 50,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Glorietta Parking",
        address: "Glorietta Mall, Makati City",
        latitude: 14.5513,
        longitude: 121.0227,
        totalSpots: 80,
        availableSpots: 28,
        pricePerHour: 60,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "6 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: false
      },
      {
        name: "BGC Street Parking",
        address: "32nd Street, Bonifacio Global City",
        latitude: 14.5509,
        longitude: 121.0513,
        totalSpots: 40,
        availableSpots: 0,
        pricePerHour: 40,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: false,
        hasCardPayment: true,
        hasAccessibleParking: false,
        hasEvCharging: false
      },
      {
        name: "Robinsons Parking",
        address: "Robinsons Place, Ermita, Manila",
        latitude: 14.5776,
        longitude: 120.9830,
        totalSpots: 60,
        availableSpots: 12,
        pricePerHour: 45,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "10 AM",
        closingTime: "9 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: false
      },
      {
        name: "Greenbelt Parking",
        address: "Greenbelt Mall, Makati City",
        latitude: 14.5504,
        longitude: 121.0190,
        totalSpots: 120,
        availableSpots: 5,
        pricePerHour: 70,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "9 AM",
        closingTime: "11 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      // Parañaque area parking spots
      {
        name: "SM City BF Parañaque Parking",
        address: "Dr. A. Santos Ave., BF Homes, Parañaque City",
        latitude: 14.4776,
        longitude: 121.0170,
        totalSpots: 150,
        availableSpots: 72,
        pricePerHour: 45,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "10 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Parañaque Integrated Terminal Exchange (PITX)",
        address: "Coastal Road, Parañaque City",
        latitude: 14.4893,
        longitude: 120.9909,
        totalSpots: 200,
        availableSpots: 120,
        pricePerHour: 50,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Ayala Malls Manila Bay Parking",
        address: "Diosdado Macapagal Blvd, Parañaque City",
        latitude: 14.5072,
        longitude: 120.9823,
        totalSpots: 250,
        availableSpots: 85,
        pricePerHour: 60,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "10 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Solaire Resort & Casino Parking",
        address: "1 Asean Avenue, Entertainment City, Parañaque City",
        latitude: 14.5125,
        longitude: 120.9799,
        totalSpots: 300,
        availableSpots: 150,
        pricePerHour: 100,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Okada Manila Parking",
        address: "New Seaside Drive, Entertainment City, Parañaque City",
        latitude: 14.5012,
        longitude: 120.9789,
        totalSpots: 400,
        availableSpots: 230,
        pricePerHour: 100,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Gateway Mall Parking",
        address: "Gateway Mall, Araneta City, Quezon City",
        latitude: 14.6196,
        longitude: 121.0531,
        totalSpots: 75,
        availableSpots: 22,
        pricePerHour: 55,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "9 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: false
      },
      {
        name: "Mall of Asia Parking",
        address: "SM Mall of Asia, Pasay City",
        latitude: 14.5355,
        longitude: 120.9805,
        totalSpots: 200,
        availableSpots: 87,
        pricePerHour: 65,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "7 AM",
        closingTime: "12 AM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Intramuros Parking",
        address: "Intramuros, Manila",
        latitude: 14.5893,
        longitude: 120.9741,
        totalSpots: 30,
        availableSpots: 8,
        pricePerHour: 35,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "8 AM",
        closingTime: "8 PM",
        hasSecurityGuard: false,
        hasCardPayment: false,
        hasAccessibleParking: false,
        hasEvCharging: false
      },
      {
        name: "Ayala Malls Parking",
        address: "Ayala Malls Manila Bay, Parañaque City",
        latitude: 14.5206,
        longitude: 120.9953,
        totalSpots: 180,
        availableSpots: 60,
        pricePerHour: 60,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "7 AM",
        closingTime: "11 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Megamall Parking",
        address: "SM Megamall, Ortigas Center, Mandaluyong",
        latitude: 14.5847,
        longitude: 121.0566,
        totalSpots: 220,
        availableSpots: 32,
        pricePerHour: 55,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "7 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Eastwood City Parking",
        address: "Eastwood City, Quezon City",
        latitude: 14.6083,
        longitude: 121.0806,
        totalSpots: 120,
        availableSpots: 28,
        pricePerHour: 50,
        currency: "₱",
        isOpen24Hours: true,
        openingTime: null,
        closingTime: null,
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "South Mall Parking",
        address: "Festival Mall, Alabang, Muntinlupa",
        latitude: 14.4198,
        longitude: 121.0406,
        totalSpots: 90,
        availableSpots: 43,
        pricePerHour: 45,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "8 AM",
        closingTime: "9 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: false
      },
      {
        name: "North EDSA Parking",
        address: "SM North EDSA, Quezon City",
        latitude: 14.6561,
        longitude: 121.0311,
        totalSpots: 150,
        availableSpots: 76,
        pricePerHour: 50,
        currency: "₱",
        isOpen24Hours: false,
        openingTime: "6 AM",
        closingTime: "11 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      }
    ];

    // Add all parking spots to the map
    sampleSpots.forEach(spot => {
      const id = this.currentParkingSpotId++;
      this.parkingSpots.set(id, { 
        ...spot, 
        id,
        pricePerHour: spot.pricePerHour || null,
        currency: spot.currency || null,
        isOpen24Hours: spot.isOpen24Hours || null,
        openingTime: spot.openingTime || null,
        closingTime: spot.closingTime || null,
        hasSecurityGuard: spot.hasSecurityGuard || null,
        hasCardPayment: spot.hasCardPayment || null,
        hasAccessibleParking: spot.hasAccessibleParking || null,
        hasEvCharging: spot.hasEvCharging || null
      });
    });
  }
}

export const storage = new MemStorage();
