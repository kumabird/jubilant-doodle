import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customErasers = pgTable("custom_erasers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(), // 'normal' or 'boss'
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  speed: integer("speed").notNull(),
  weight: integer("weight").notNull(),
});

export const insertCustomEraserSchema = createInsertSchema(customErasers).omit({ id: true });

export type CustomEraser = typeof customErasers.$inferSelect;
export type InsertCustomEraser = z.infer<typeof insertCustomEraserSchema>;
