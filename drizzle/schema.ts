import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  username: text("username", { length: 80 }).unique(),
  passwordHash: text("passwordHash", { length: 255 }),
  sector: text("sector", { length: 180 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(strftime('%s','now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().default(sql`(strftime('%s','now') * 1000)`),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" }).notNull().default(sql`(strftime('%s','now') * 1000)`),
});

export const alerts = sqliteTable("alerts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  observations: text("observations"),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(strftime('%s','now') * 1000)`),
  scheduledFor: integer("scheduledFor", { mode: "timestamp_ms" }).notNull(),
}, table => [index("alerts_scheduled_for_idx").on(table.scheduledFor)]);

export const alertReads = sqliteTable("alertReads", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  alertId: integer("alertId").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: integer("readAt", { mode: "timestamp_ms" }).notNull().default(sql`(strftime('%s','now') * 1000)`),
}, table => [uniqueIndex("alert_reads_alert_user_unique").on(table.alertId, table.userId), index("alert_reads_user_idx").on(table.userId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
