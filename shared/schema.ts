import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 特性タイプ定義
export const ABILITY_TYPES = {
  // ノーマル消しゴム用（50pt消費）
  COATING_ATTACK_DOWN: 'coating_attack_down',      // コーティング：相手攻撃力低下
  COATING_DEFENSE_DOWN: 'coating_defense_down',    // コーティング：相手防御力低下
  COATING_SLIP: 'coating_slip',                    // コーティング：滑る
  SPIN_BLOW: 'spin_blow',                          // 回転：遠くに吹き飛ばす
  SPIN_SLOW: 'spin_slow',                          // 回転：相手動き悪くする
  EXPLOSION_BLOW: 'explosion_blow',                // 爆発：遠くに吹き飛ばす
  EXPLOSION_BARRIER: 'explosion_barrier',          // 爆発：1ターン近づけない
  // ボス専用（150pt消費）
  BIG_SPIN_BARRIER: 'big_spin_barrier',            // 大回転：2ターン近づけない＆吹き飛ばす
  JET_RUSH: 'jet_rush',                            // ジェット：相手に当たるまで進む
  MISSILE_ATTACK: 'missile_attack',                // ミサイル：毎ターン3つ発射
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
