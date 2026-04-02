import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 特性タイプ定義
export const ABILITY_TYPES = {
  // ノーマル消しゴム用（50pt消費）
  COATING_ATTACK_DOWN: 'coating_attack_down',
  COATING_DEFENSE_DOWN: 'coating_defense_down',
  COATING_SLIP: 'coating_slip',
  SPIN_BLOW: 'spin_blow',
  SPIN_SLOW: 'spin_slow',
  EXPLOSION_BLOW: 'explosion_blow',
  EXPLOSION_BARRIER: 'explosion_barrier',
  // ボス専用（150pt消費）
  BIG_SPIN_BARRIER: 'big_spin_barrier',
  JET_RUSH: 'jet_rush',
  MISSILE_ATTACK: 'missile_attack',
} as const;

export type AbilityType = typeof ABILITY_TYPES[keyof typeof ABILITY_TYPES];

export const customErasers = pgTable("custom_erasers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(),
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  speed: integer("speed").notNull(),
  weight: integer("weight").notNull(),
  ability: text("ability"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomEraserSchema = createInsertSchema(customErasers).omit({
  id: true,
  createdAt: true,
});

export const selectCustomEraserSchema = createSelectSchema(customErasers);

export type InsertCustomEraser = z.infer<typeof insertCustomEraserSchema>;
export type SelectCustomEraser = z.infer<typeof selectCustomEraserSchema>;
