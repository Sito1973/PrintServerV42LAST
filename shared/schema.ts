import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies table - NUEVA TABLA
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  isActive: true,
});

// Locations table - NUEVA TABLA
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  companyId: true,
  isActive: true,
});

// Users table - ACTUALIZADA con nuevas columnas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  apiKey: text("api_key").notNull().unique(),
  isAdmin: boolean("is_admin").default(false),
  // Campos existentes (mantener por compatibilidad)
  location: text("location"), // Empresa (string legacy)
  floor: text("floor"), // Sede (string legacy)
  // NUEVAS COLUMNAS con referencias a las tablas
  companyId: integer("company_id").references(() => companies.id),
  locationId: integer("location_id").references(() => locations.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
  location: true,
  floor: true,
  companyId: true,
  locationId: true,
});

// Printers table - ACTUALIZADA con nuevas columnas
export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  status: text("status").default("offline"),
  lastPrintTime: timestamp("last_print_time"),
  uniqueId: text("unique_id").notNull().unique(),
  isActive: boolean("is_active").default(true),
  // Campos existentes (mantener por compatibilidad)
  location: text("location"), // Empresa (string legacy)
  floor: text("floor"), // Sede (string legacy)
  // NUEVAS COLUMNAS con referencias a las tablas
  companyId: integer("company_id").references(() => companies.id),
  locationId: integer("location_id").references(() => locations.id),
});

export const insertPrinterSchema = createInsertSchema(printers).pick({
  name: true,
  location: true,
  model: true,
  status: true,
  floor: true,
  uniqueId: true,
  isActive: true,
  companyId: true,
  locationId: true,
});

// Print Jobs table - SIN CAMBIOS
export const printJobs = pgTable("print_jobs", {
  id: serial("id").primaryKey(),
  documentUrl: text("document_url").notNull(),
  documentName: text("document_name").notNull(),
  printerId: integer("printer_id").references(() => printers.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, ready_for_client
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  copies: integer("copies").default(1),
  duplex: boolean("duplex").default(false),
  orientation: text("orientation").default("portrait"), // portrait, landscape
  qzTrayData: text("qz_tray_data"), // Datos preparados para QZ Tray
});

export const insertPrintJobSchema = createInsertSchema(printJobs).pick({
  documentUrl: true,
  documentName: true,
  printerId: true,
  userId: true,
  copies: true,
  duplex: true,
  orientation: true,
});

// API Key validation schema - SIN CAMBIOS
export const apiKeyHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer\s.+$/i),
});

// Print job request schema - SIN CAMBIOS
export const printJobRequestSchema = z.object({
  printerId: z.string(),
  documentUrl: z.string().url(),
  options: z.object({
    copies: z.number().int().positive().default(1),
    duplex: z.boolean().default(false),
    orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  }).default({}),
});

// Simplified print job request schema for API (string printer ID) - SIN CAMBIOS
export const simplePrintJobRequestSchema = z.object({
  printerId: z.string(),
  documentUrl: z.string().url(),
});

// Esquema para endpoint con ID numérico de impresora
export const numericPrinterJobRequestSchema = z.object({
  printerId: z.number().int().positive(),
  documentUrl: z.string().url(),
  documentName: z.string().optional(),
  copies: z.number().int().min(1).max(999).optional().default(1),
  duplex: z.boolean().optional().default(false),
  orientation: z.enum(['portrait', 'landscape', 'reverse-portrait', 'reverse-landscape']).optional().default('portrait'),
  margins: z.object({
    top: z.number().min(0).optional(),
    right: z.number().min(0).optional(),
    bottom: z.number().min(0).optional(),
    left: z.number().min(0).optional()
  }).optional(),
  options: z.object({
    ignoreTransparency: z.boolean().optional(),
    altFontRendering: z.boolean().optional(),
    pageRanges: z.string().optional(),
    scaleContent: z.boolean().optional(),
    rasterize: z.boolean().optional(),
    colorType: z.enum(['color', 'grayscale', 'blackwhite']).optional(),
    density: z.number().min(72).max(1200).optional(),
    interpolation: z.enum(['nearest', 'bilinear', 'bicubic', 'lanczos']).optional()
  }).optional()
});

// Nuevo schema para trabajos de impresión con Base64
export const base64PrintJobRequestSchema = z.object({
  printerId: z.number().positive(),
  documentBase64: z.string().min(1),
  documentName: z.string().min(1),
  format: z.enum(['pdf', 'image', 'html', 'txt', 'svg']).optional().default('image'),
  copies: z.number().positive().optional().default(1),
  duplex: z.boolean().optional().default(false),
  orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
  margins: z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional()
  }).optional(),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    units: z.enum(['in', 'mm', 'cm']).optional().default('in')
  }).optional(),
  options: z.object({
    pageRanges: z.string().optional(),
    ignoreTransparency: z.boolean().optional(),
    altFontRendering: z.boolean().optional(),
    scaleContent: z.boolean().optional(),
    rasterize: z.boolean().optional(),
    interpolation: z.string().optional(),
    colorType: z.string().optional(),
    density: z.union([z.string(), z.number()]).optional()
  }).optional()
});

// Types - Existentes
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPrinter = z.infer<typeof insertPrinterSchema>;
export type Printer = typeof printers.$inferSelect;

export type InsertPrintJob = z.infer<typeof insertPrintJobSchema>;
export type PrintJob = typeof printJobs.$inferSelect;

// Types - NUEVOS para companies y locations
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Types para respuestas con relaciones - NUEVOS
export type CompanyWithLocations = Company & {
  locations: Location[];
};

export type UserWithCompanyLocation = User & {
  company?: Company;
  location?: Location;
};

export type PrinterWithCompanyLocation = Printer & {
  company?: Company;
  location?: Location;
};

// Types existentes
export type PrintJobRequest = z.infer<typeof printJobRequestSchema>;
export type SimplePrintJobRequest = z.infer<typeof simplePrintJobRequestSchema>;
export type NumericPrinterJobRequest = z.infer<typeof numericPrinterJobRequestSchema>;