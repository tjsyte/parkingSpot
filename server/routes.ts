import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { parkingSpotClientSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for users
  app.get("/api/users/uid/:uid", async (req, res) => {
    try {
      const uid = req.params.uid;
      
      if (!uid) {
        return res.status(400).json({ message: "Missing Firebase UID" });
      }
      
      const user = await storage.getUserByUid(uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by UID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add a new user to the database
  app.post("/api/users", async (req, res) => {
    try {
      const schema = z.object({
        uid: z.string(),
        email: z.string().email(),
        displayName: z.string().optional(),
      });

      const validation = schema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data" });
      }

      const { uid, email, displayName } = validation.data;

      const user = await storage.createUser({ uid, email, displayName });
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API routes for parking spots
  app.get("/api/parking-spots", async (_req, res) => {
    try {
      const spots = await storage.getAllParkingSpots();
      
      // Transform storage spots to client format
      const clientSpots = spots.map(spot => ({
        id: spot.id,
        name: spot.name,
        address: spot.address,
        latitude: spot.latitude,
        longitude: spot.longitude,
        availableSpots: spot.availableSpots,
        totalSpots: spot.totalSpots,
        pricePerHour: spot.pricePerHour,
        currency: spot.currency,
        isOpen24Hours: spot.isOpen24Hours,
        openingTime: spot.openingTime,
        closingTime: spot.closingTime,
        features: {
          hasSecurityGuard: spot.hasSecurityGuard,
          hasCardPayment: spot.hasCardPayment,
          hasAccessibleParking: spot.hasAccessibleParking,
          hasEvCharging: spot.hasEvCharging
        }
      }));

      res.json(clientSpots);
    } catch (error) {
      console.error("Error fetching parking spots:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a single parking spot by ID
  app.get("/api/parking-spots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid parking spot ID" });
      }
      
      const spot = await storage.getParkingSpot(id);
      
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }
      
      // Transform to client format
      const clientSpot = {
        id: spot.id,
        name: spot.name,
        address: spot.address,
        latitude: spot.latitude,
        longitude: spot.longitude,
        availableSpots: spot.availableSpots,
        totalSpots: spot.totalSpots,
        pricePerHour: spot.pricePerHour,
        currency: spot.currency,
        isOpen24Hours: spot.isOpen24Hours,
        openingTime: spot.openingTime,
        closingTime: spot.closingTime,
        features: {
          hasSecurityGuard: spot.hasSecurityGuard,
          hasCardPayment: spot.hasCardPayment,
          hasAccessibleParking: spot.hasAccessibleParking,
          hasEvCharging: spot.hasEvCharging
        }
      };
      
      res.json(clientSpot);
    } catch (error) {
      console.error("Error fetching parking spot:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search parking spots by coordinates and radius
  app.get("/api/parking-spots/search", async (req, res) => {
    try {
      const schema = z.object({
        lat: z.string().transform(val => parseFloat(val)),
        lng: z.string().transform(val => parseFloat(val)),
        radius: z.string().optional().transform(val => val ? parseFloat(val) : 5) // Default 5km radius
      });
      
      const validation = schema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid search parameters" });
      }
      
      const { lat, lng, radius } = validation.data;
      
      // Get spots near the coordinates
      const spots = await storage.getParkingSpotsByLocation(lat, lng, radius);
      
      // Transform to client format
      const clientSpots = spots.map(spot => ({
        id: spot.id,
        name: spot.name,
        address: spot.address,
        latitude: spot.latitude,
        longitude: spot.longitude,
        availableSpots: spot.availableSpots,
        totalSpots: spot.totalSpots,
        pricePerHour: spot.pricePerHour,
        currency: spot.currency,
        isOpen24Hours: spot.isOpen24Hours,
        openingTime: spot.openingTime,
        closingTime: spot.closingTime,
        features: {
          hasSecurityGuard: spot.hasSecurityGuard,
          hasCardPayment: spot.hasCardPayment,
          hasAccessibleParking: spot.hasAccessibleParking,
          hasEvCharging: spot.hasEvCharging
        }
      }));
      
      res.json(clientSpots);
    } catch (error) {
      console.error("Error searching for parking spots:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API route for user favorites
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add a parking spot to favorites
  app.post("/api/favorites", async (req, res) => {
    try {
      const schema = z.object({
        userId: z.number(),
        parkingSpotId: z.number()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid favorite data" });
      }
      
      const { userId, parkingSpotId } = validation.data;
      
      const favorite = await storage.addFavorite(userId, parkingSpotId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove a parking spot from favorites
  app.delete("/api/favorites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid favorite ID" });
      }
      
      await storage.removeFavorite(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
