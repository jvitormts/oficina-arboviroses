import { sql } from "drizzle-orm";
import { index, int, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).default(sql`NULL`),
  email: varchar("email", { length: 320 }).default(sql`NULL`),
  username: varchar("username", { length: 80 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).default(sql`NULL`),
  sector: varchar("sector", { length: 180 }).default(sql`NULL`),
  loginMethod: varchar("loginMethod", { length: 64 }).default(sql`NULL`),
  role: varchar("role", { length: 10 }).notNull().default("user"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  observations: text("observations").default(sql`NULL`),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  scheduledFor: timestamp("scheduledFor").notNull(),
}, table => [index("alerts_scheduled_for_idx").on(table.scheduledFor)]);

export const alertReads = mysqlTable("alertReads", {
  id: int("id").primaryKey().autoincrement(),
  alertId: int("alertId").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("readAt").notNull().defaultNow(),
}, table => [uniqueIndex("alert_reads_alert_user_unique").on(table.alertId, table.userId), index("alert_reads_user_idx").on(table.userId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
