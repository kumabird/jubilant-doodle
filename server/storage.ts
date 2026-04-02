import { db } from "./db";
import {
  customErasers,
  type CustomEraser,
  type InsertCustomEraser
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getCustomErasers(): Promise<CustomEraser[]>;
  createCustomEraser(eraser: InsertCustomEraser): Promise<CustomEraser>;
  deleteCustomEraser(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCustomErasers(): Promise<CustomEraser[]> {
    return await db.select().from(customErasers);
  }

  async createCustomEraser(eraser: InsertCustomEraser): Promise<CustomEraser> {
    const [created] = await db.insert(customErasers).values(eraser).returning();
    return created;
  }

  async deleteCustomEraser(id: number): Promise<void> {
    await db.delete(customErasers).where(eq(customErasers.id, id));
  }
}

export const storage = new DatabaseStorage();
