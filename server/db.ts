import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { Alert, alerts, alertReads, InsertAlert, InsertUser, users, User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { resolveReadReceipt } from "./alertRules";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

export async function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL ?? ENV.databaseUrl;
    if (!url) throw new Error("DATABASE_URL não está configurado.");
    const client = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
    _db = drizzle(client);
  }
  return _db;
}

export async function runMigrations() {
  const db = requiredDb(await getDb());
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
}

function requiredDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("O banco de dados não está disponível.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "username", "passwordHash"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field];
      updateSet[field] = user[field];
    }
  });

  if (user.role !== undefined && user.role !== null) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (user.role === undefined && user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getInstitutionalUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1))[0];
}

export async function createInstitutionalUser(user: InsertUser) {
  const db = requiredDb(await getDb());
  const result = await db.insert(users).values({ ...user, lastSignedIn: new Date() }).returning({ id: users.id });
  return { id: result[0]?.id ?? 0 };
}

export async function createAlert(alert: Omit<InsertAlert, "id" | "createdAt">) {
  const db = requiredDb(await getDb());
  const result = await db.insert(alerts).values(alert).returning({ id: alerts.id });
  return { id: result[0]?.id ?? 0 };
}

export async function updateAlert(id: number, changes: Partial<Omit<InsertAlert, "id" | "createdAt" | "createdBy" | "publishedAt">>) {
  const db = requiredDb(await getDb());
  const existing = await getAlertById(id);
  if (!existing) return false;
  await db.update(alerts).set(changes).where(eq(alerts.id, id));
  return true;
}

export async function getAlertById(id: number) {
  const db = requiredDb(await getDb());
  return (await db.select().from(alerts).where(eq(alerts.id, id)).limit(1))[0] ?? null;
}

export async function publishAlert(id: number) {
  const db = requiredDb(await getDb());
  const existing = await getAlertById(id);
  if (!existing) return false;
  if (existing.publishedAt) return true;
  await db.update(alerts).set({ publishedAt: new Date() }).where(eq(alerts.id, id));
  return true;
}

export async function deleteAlert(id: number) {
  const db = requiredDb(await getDb());
  const existing = await getAlertById(id);
  if (!existing) return false;
  await db.delete(alerts).where(eq(alerts.id, id));
  return true;
}

export async function listAllAlerts() {
  const db = requiredDb(await getDb());
  const [allAlerts, readCounts] = await Promise.all([
    db.select().from(alerts).orderBy(desc(alerts.createdAt)),
    db.select({ alertId: alertReads.alertId, total: sql<number>`count(*)` as any })
      .from(alertReads)
      .innerJoin(users, eq(users.id, alertReads.userId))
      .where(eq(users.role, "user"))
      .groupBy(alertReads.alertId),
  ]);

  const countByAlertId = new Map(readCounts.map((row: any) => [row.alertId, Number(row.total)]));
  return allAlerts.map((alert: Alert) => ({ ...alert, readCount: countByAlertId.get(alert.id) ?? 0 }));
}

export async function listPublishedAlertsForUser(userId: number) {
  const db = requiredDb(await getDb());
  const rows = await db.select({ id: alerts.id, title: alerts.title, summary: alerts.summary, observations: alerts.observations, createdAt: alerts.createdAt, publishedAt: alerts.publishedAt, readId: alertReads.id, readAt: alertReads.readAt }).from(alerts).leftJoin(alertReads, and(eq(alertReads.alertId, alerts.id), eq(alertReads.userId, userId))).where(isNotNull(alerts.publishedAt)).orderBy(desc(alerts.publishedAt));
  return rows.map((row: any) => ({ ...row, isRead: Boolean(row.readId), readAt: row.readAt }));
}

export async function getAlertForUser(id: number, user: User) {
  const db = requiredDb(await getDb());
  const filter = user.role === "admin" ? eq(alerts.id, id) : and(eq(alerts.id, id), isNotNull(alerts.publishedAt));
  const alert = (await db.select().from(alerts).where(filter).limit(1))[0];
  if (alert && user.role !== "admin" && !alert.publishedAt) return undefined;
  return alert;
}

export async function markAlertRead(alertId: number, userId: number) {
  const db = requiredDb(await getDb());
  const existing = (await db.select({ id: alertReads.id, readAt: alertReads.readAt }).from(alertReads).where(and(eq(alertReads.alertId, alertId), eq(alertReads.userId, userId))).limit(1))[0];
  const receipt = resolveReadReceipt(existing?.readAt);
  if (existing) return receipt;
  await db.insert(alertReads).values({ alertId, userId, readAt: receipt.readAt });
  return receipt;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = requiredDb(await getDb());
  const result = await db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning({ id: users.id });
  return result.length > 0;
}

export async function listAlertReaders(alertId: number) {
  const db = requiredDb(await getDb());
  return db.select({ id: users.id, name: users.name, username: users.username, role: users.role, readAt: alertReads.readAt }).from(users).leftJoin(alertReads, and(eq(alertReads.userId, users.id), eq(alertReads.alertId, alertId))).where(eq(users.role, "user")).orderBy(users.name);
}
