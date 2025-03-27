// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
var MemStorage = class {
  users;
  parkingSpots;
  favorites;
  currentUserId;
  currentParkingSpotId;
  currentFavoriteId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.parkingSpots = /* @__PURE__ */ new Map();
    this.favorites = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentParkingSpotId = 1;
    this.currentFavoriteId = 1;
    this.initializeSampleData();
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async getUserByUid(uid) {
    return Array.from(this.users.values()).find(
      (user) => user.uid === uid
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = {
      ...insertUser,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      uid: insertUser.uid || null,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      provider: insertUser.provider || null
    };
    this.users.set(id, user);
    return user;
  }
  // Parking spot methods
  async getParkingSpot(id) {
    return this.parkingSpots.get(id);
  }
  async getAllParkingSpots() {
    return Array.from(this.parkingSpots.values());
  }
  async getParkingSpotsByLocation(lat, lng, radius) {
    return Array.from(this.parkingSpots.values()).filter((spot) => {
      const distance = calculateDistance(lat, lng, spot.latitude, spot.longitude);
      return distance <= radius;
    });
  }
  async createParkingSpot(insertSpot) {
    const id = this.currentParkingSpotId++;
    const spot = {
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
  async updateParkingSpotAvailability(id, availableSpots) {
    const spot = this.parkingSpots.get(id);
    if (!spot) return void 0;
    const updatedSpot = {
      ...spot,
      availableSpots
    };
    this.parkingSpots.set(id, updatedSpot);
    return updatedSpot;
  }
  // Favorites methods
  async getUserFavorites(userId) {
    const userFavorites = Array.from(this.favorites.values()).filter(
      (fav) => fav.userId === userId
    );
    const favoriteSpots = [];
    for (const favorite of userFavorites) {
      const spot = this.parkingSpots.get(favorite.parkingSpotId);
      if (spot) favoriteSpots.push(spot);
    }
    return favoriteSpots;
  }
  async addFavorite(userId, parkingSpotId) {
    const existing = Array.from(this.favorites.values()).find(
      (fav) => fav.userId === userId && fav.parkingSpotId === parkingSpotId
    );
    if (existing) return existing;
    const id = this.currentFavoriteId++;
    const createdAt = /* @__PURE__ */ new Date();
    const favorite = {
      id,
      userId,
      parkingSpotId,
      createdAt
    };
    this.favorites.set(id, favorite);
    return favorite;
  }
  async removeFavorite(id) {
    this.favorites.delete(id);
  }
  async getFavorites(userId) {
    return Array.from(this.favorites.values()).filter((fav) => fav.userId === userId);
  }
  async getHistory(userId) {
    return Array.from(this.history.values()).filter((hist) => hist.userId === userId);
  }
  // Initialize with sample parking spots
  initializeSampleData() {
    const sampleSpots = [
      {
        name: "SM Mall Parking",
        address: "123 Ayala Avenue, Makati City",
        latitude: 14.5547,
        longitude: 121.0244,
        totalSpots: 100,
        availableSpots: 45,
        pricePerHour: 50,
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        longitude: 120.983,
        totalSpots: 60,
        availableSpots: 12,
        pricePerHour: 45,
        currency: "\u20B1",
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
        longitude: 121.019,
        totalSpots: 120,
        availableSpots: 5,
        pricePerHour: 70,
        currency: "\u20B1",
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
        name: "SM City BF Para\xF1aque Parking",
        address: "Dr. A. Santos Ave., BF Homes, Para\xF1aque City",
        latitude: 14.4776,
        longitude: 121.017,
        totalSpots: 150,
        availableSpots: 72,
        pricePerHour: 45,
        currency: "\u20B1",
        isOpen24Hours: false,
        openingTime: "10 AM",
        closingTime: "10 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      },
      {
        name: "Para\xF1aque Integrated Terminal Exchange (PITX)",
        address: "Coastal Road, Para\xF1aque City",
        latitude: 14.4893,
        longitude: 120.9909,
        totalSpots: 200,
        availableSpots: 120,
        pricePerHour: 50,
        currency: "\u20B1",
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
        address: "Diosdado Macapagal Blvd, Para\xF1aque City",
        latitude: 14.5072,
        longitude: 120.9823,
        totalSpots: 250,
        availableSpots: 85,
        pricePerHour: 60,
        currency: "\u20B1",
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
        address: "1 Asean Avenue, Entertainment City, Para\xF1aque City",
        latitude: 14.5125,
        longitude: 120.9799,
        totalSpots: 300,
        availableSpots: 150,
        pricePerHour: 100,
        currency: "\u20B1",
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
        address: "New Seaside Drive, Entertainment City, Para\xF1aque City",
        latitude: 14.5012,
        longitude: 120.9789,
        totalSpots: 400,
        availableSpots: 230,
        pricePerHour: 100,
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        address: "Ayala Malls Manila Bay, Para\xF1aque City",
        latitude: 14.5206,
        longitude: 120.9953,
        totalSpots: 180,
        availableSpots: 60,
        pricePerHour: 60,
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
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
        currency: "\u20B1",
        isOpen24Hours: false,
        openingTime: "6 AM",
        closingTime: "11 PM",
        hasSecurityGuard: true,
        hasCardPayment: true,
        hasAccessibleParking: true,
        hasEvCharging: true
      }
    ];
    sampleSpots.forEach((spot) => {
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
};
var storage = new MemStorage();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/users/uid/:uid", async (req, res) => {
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
  app2.post("/api/users", async (req, res) => {
    try {
      const schema = z.object({
        uid: z.string(),
        email: z.string(),
        // Removed email validation
        displayName: z.string().optional()
      });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation Error:", validation.error);
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      const { uid, email, displayName } = validation.data;
      const user = await storage.createUser({ uid, email, displayName });
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/parking-spots", async (_req, res) => {
    try {
      const spots = await storage.getAllParkingSpots();
      const clientSpots = spots.map((spot) => ({
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
  app2.get("/api/parking-spots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid parking spot ID" });
      }
      const spot = await storage.getParkingSpot(id);
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }
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
  app2.get("/api/parking-spots/search", async (req, res) => {
    try {
      const schema = z.object({
        lat: z.string().transform((val) => parseFloat(val)),
        lng: z.string().transform((val) => parseFloat(val)),
        radius: z.string().optional().transform((val) => val ? parseFloat(val) : 5)
        // Default 5km radius
      });
      const validation = schema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid search parameters" });
      }
      const { lat, lng, radius } = validation.data;
      const spots = await storage.getParkingSpotsByLocation(lat, lng, radius);
      const clientSpots = spots.map((spot) => ({
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
  app2.get("/api/favorites/:userId", async (req, res) => {
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
  app2.post("/api/favorites", async (req, res) => {
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
  app2.delete("/api/favorites/:id", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
