import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - extends existing schema with additional fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  uid: text("uid").unique(), // Firebase UID
  provider: text("provider"), // "google" or "password"
  createdAt: timestamp("created_at").defaultNow()
});

// Parking spots table
export const parkingSpots = pgTable("parking_spots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  totalSpots: integer("total_spots").notNull(),
  availableSpots: integer("available_spots").notNull(),
  pricePerHour: real("price_per_hour"),
  currency: text("currency").default("₱"),
  isOpen24Hours: boolean("is_open_24_hours").default(false),
  openingTime: text("opening_time"),
  closingTime: text("closing_time"),
  hasSecurityGuard: boolean("has_security_guard").default(false),
  hasCardPayment: boolean("has_card_payment").default(false),
  hasAccessibleParking: boolean("has_accessible_parking").default(false),
  hasEvCharging: boolean("has_ev_charging").default(false)
});

// Favorites table to track user favorites
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  parkingSpotId: integer("parking_spot_id").notNull().references(() => parkingSpots.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Create Zod schemas from tables
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertParkingSpotSchema = createInsertSchema(parkingSpots)
  .omit({ id: true });

export const insertFavoriteSchema = createInsertSchema(favorites)
  .omit({ id: true, createdAt: true });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertParkingSpot = z.infer<typeof insertParkingSpotSchema>;
export type ParkingSpot = typeof parkingSpots.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Create a simplified ParkingSpot schema for the client
export const parkingSpotClientSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  availableSpots: z.number(),
  totalSpots: z.number(),
  pricePerHour: z.number().nullable(),
  currency: z.string(),
  isOpen24Hours: z.boolean(),
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  distance: z.number().optional(),
  duration: z.number().optional(),
  isFavorite: z.boolean().default(false),
  features: z.object({
    hasSecurityGuard: z.boolean(),
    hasCardPayment: z.boolean(),
    hasAccessibleParking: z.boolean(),
    hasEvCharging: z.boolean()
  })
});

export type ParkingSpotClient = z.infer<typeof parkingSpotClientSchema>;
