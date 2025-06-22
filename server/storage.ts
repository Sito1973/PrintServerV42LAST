import { 
  type User, type InsertUser, 
  type Printer, type InsertPrinter,
  type PrintJob, type InsertPrintJob,
  users, printers, printJobs
} from "@shared/schema";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByApiKey(apiKey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;

  // Printer methods
  getPrinter(id: number): Promise<Printer | undefined>;
  getPrinterByUniqueId(uniqueId: string): Promise<Printer | undefined>;
  createPrinter(printer: InsertPrinter): Promise<Printer>;
  updatePrinter(id: number, printer: Partial<Printer>): Promise<Printer | undefined>;
  deletePrinter(id: number): Promise<boolean>;
  listPrinters(): Promise<Printer[]>;

  // Print Job methods
  getPrintJob(id: number): Promise<PrintJob | undefined>;
  createPrintJob(printJob: InsertPrintJob): Promise<PrintJob>;
  updatePrintJob(id: number, printJob: Partial<PrintJob>): Promise<PrintJob | undefined>;
  deletePrintJob(id: number): Promise<boolean>;
  listPrintJobs(): Promise<PrintJob[]>;
  getPrintJobsByPrinter(printerId: number): Promise<PrintJob[]>;
  getPrintJobsByUser(userId: number): Promise<PrintJob[]>;
  getRecentPrintJobs(limit: number): Promise<PrintJob[]>;
}

// Helper function to generate unique API keys
function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

// PostgreSQL database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.apiKey, apiKey));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const apiKey = generateApiKey();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, apiKey })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserApiKey(userId: number): Promise<string | null> {
    const [user] = await db.select({ apiKey: users.apiKey }).from(users).where(eq(users.id, userId));
    return user ? user.apiKey : null;
  }

  async rotateUserApiKey(userId: number): Promise<string | null> {
    const newApiKey = generateApiKey();
    const [updatedUser] = await db
      .update(users)
      .set({ apiKey: newApiKey })
      .where(eq(users.id, userId))
      .returning({ apiKey: users.apiKey });
    return updatedUser ? updatedUser.apiKey : null;
  }

  // Printer methods
  async getPrinter(id: number): Promise<Printer | undefined> {
    const [printer] = await db.select().from(printers).where(eq(printers.id, id));
    return printer;
  }

  async getPrinterByUniqueId(uniqueId: string): Promise<Printer | undefined> {
    const [printer] = await db
      .select()
      .from(printers)
      .where(eq(printers.uniqueId, uniqueId));
    return printer;
  }

  async createPrinter(insertPrinter: InsertPrinter): Promise<Printer> {
    const [printer] = await db
      .insert(printers)
      .values(insertPrinter)
      .returning();
    return printer;
  }

  async updatePrinter(id: number, printerData: Partial<Printer>): Promise<Printer | undefined> {
    const [updatedPrinter] = await db
      .update(printers)
      .set(printerData)
      .where(eq(printers.id, id))
      .returning();
    return updatedPrinter;
  }

  async deletePrinter(id: number): Promise<boolean> {
    const result = await db.delete(printers).where(eq(printers.id, id));
    return !!result;
  }

  async listPrinters(): Promise<Printer[]> {
    return await db.select().from(printers);
  }

  // Print Job methods
  async getPrintJob(id: number): Promise<PrintJob | undefined> {
    const [printJob] = await db.select().from(printJobs).where(eq(printJobs.id, id));
    return printJob;
  }

  async createPrintJob(insertPrintJob: InsertPrintJob): Promise<PrintJob> {
    const now = new Date();
    const [printJob] = await db
      .insert(printJobs)
      .values({
        ...insertPrintJob,
        status: 'pending',
        createdAt: now
      })
      .returning();

    // Update printer's last print time
    if (printJob) {
      await db
        .update(printers)
        .set({ 
          lastPrintTime: now,
          status: 'busy'
        })
        .where(eq(printers.id, printJob.printerId));
    }

    return printJob;
  }

  async updatePrintJob(id: number, printJobData: Partial<PrintJob>): Promise<PrintJob | undefined> {
    // Get the current print job
    const [currentJob] = await db
      .select()
      .from(printJobs)
      .where(eq(printJobs.id, id));

    if (!currentJob) return undefined;

    // If job is marked as completed, update the completedAt timestamp
    const updates = { ...printJobData };
    if (printJobData.status === 'completed' && !currentJob.completedAt) {
      updates.completedAt = new Date();

      // Update printer status to online if it was busy with this job
      await db
        .update(printers)
        .set({ status: 'online' })
        .where(and(
          eq(printers.id, currentJob.printerId),
          eq(printers.status, 'busy')
        ));
    }

    // If job is marked as failed, also update printer status to online
    if (printJobData.status === 'failed') {
      // Update printer status to online if it was busy with this job
      await db
        .update(printers)
        .set({ status: 'online' })
        .where(and(
          eq(printers.id, currentJob.printerId),
          eq(printers.status, 'busy')
        ));
    }

    const [updatedPrintJob] = await db
      .update(printJobs)
      .set(updates)
      .where(eq(printJobs.id, id))
      .returning();

    return updatedPrintJob;
  }

  async deletePrintJob(id: number): Promise<boolean> {
    try {
      const result = await db.delete(printJobs).where(eq(printJobs.id, id));
      // En PostgreSQL, el result contiene rowCount que indica cuántas filas fueron afectadas
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error(`❌ Error eliminando trabajo ${id}:`, error);
      return false;
    }
  }

  async listPrintJobs(): Promise<PrintJob[]> {
    return await db.select().from(printJobs);
  }

  async getPrintJobsByPrinter(printerId: number): Promise<PrintJob[]> {
    return await db
      .select()
      .from(printJobs)
      .where(eq(printJobs.printerId, printerId));
  }

  async getPrintJobsByUser(userId: number): Promise<PrintJob[]> {
    return await db
      .select()
      .from(printJobs)
      .where(eq(printJobs.userId, userId));
  }

  async getRecentPrintJobs(limit: number): Promise<PrintJob[]> {
    return await db
      .select()
      .from(printJobs)
      .orderBy(desc(printJobs.createdAt))
      .limit(limit);
  }

  // Helper method to seed initial data (admin user and sample printers)
  async seedInitialData(): Promise<void> {
    // Check if we have any users
    const existingUsers = await this.listUsers();
    if (existingUsers.length === 0) {
      // Create default admin user
      await this.createUser({
        username: 'admin',
        password: 'admin123', // In a real app, this would be hashed
        name: 'Admin User',
        email: 'admin@example.com',
        isAdmin: true
      });
    }

    // Check if we have any printers
    const existingPrinters = await this.listPrinters();
    if (existingPrinters.length === 0) {
      // Create sample printers for testing
      await this.createPrinter({
        name: "Office Printer",
        location: "Main Office",
        model: "HP LaserJet Pro",
        status: "online",
        floor: "1st Floor",
        uniqueId: "printer123",
        isActive: true
      });

      await this.createPrinter({
        name: "Conference Room Printer",
        location: "Conference Room",
        model: "Epson WorkForce",
        status: "online",
        floor: "2nd Floor",
        uniqueId: "printer456",
        isActive: true
      });
    }
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();
