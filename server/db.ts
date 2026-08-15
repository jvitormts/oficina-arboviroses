import { and, asc, desc, eq, gt, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Alert, alerts, alertReads, InsertAlert, InsertUser, users, User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isAlertPublished, resolveReadReceipt } from "./alertRules";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) _db = drizzle(process.env.DATABASE_URL);
  return _db;
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
  (["name", "email", "loginMethod", "username", "passwordHash", "sector"] as const).forEach(field => {
    if (user[field] !== undefined) { values[field] = user[field]; updateSet[field] = user[field]; }
  });
  if (user.role !== undefined && user.role !== null) { values.role = user.role; updateSet.role = user.role; }
  if (user.role === undefined && user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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
  const result = await db.insert(users).values({ ...user, lastSignedIn: new Date() });
  return { id: Number(result[0].insertId) };
}

export async function listInstitutionalUsers() {
  const db = requiredDb(await getDb());
  return db.select({ id: users.id, name: users.name, username: users.username, sector: users.sector, role: users.role, createdAt: users.createdAt }).from(users).orderBy(users.name);
}

export async function createAlert(alert: Omit<InsertAlert, "id" | "createdAt">) {
  const db = requiredDb(await getDb());
  const result = await db.insert(alerts).values(alert);
  return { id: Number(result[0].insertId) };
}

export async function updateAlert(id: number, changes: Partial<Omit<InsertAlert, "id" | "createdAt" | "createdBy">>) {
  const db = requiredDb(await getDb());
  const result = await db.update(alerts).set(changes).where(eq(alerts.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteAlert(id: number) {
  const db = requiredDb(await getDb());
  const result = await db.delete(alerts).where(eq(alerts.id, id));
  return result[0].affectedRows > 0;
}

export async function listAllAlerts() {
  const db = requiredDb(await getDb());
  const [allAlerts, readCounts] = await Promise.all([
    db.select().from(alerts).orderBy(desc(alerts.scheduledFor)),
    db.select({ alertId: alertReads.alertId, total: sql<number>`count(*)` })
      .from(alertReads)
      .innerJoin(users, eq(users.id, alertReads.userId))
      .where(eq(users.role, "user"))
      .groupBy(alertReads.alertId),
  ]);
  const countByAlertId = new Map(readCounts.map(row => [row.alertId, Number(row.total)]));
  return allAlerts.map(alert => ({ ...alert, readCount: countByAlertId.get(alert.id) ?? 0 }));
}

export async function listPublishedAlertsForUser(userId: number) {
  const db = requiredDb(await getDb());
  const rows = await db.select({ id: alerts.id, title: alerts.title, summary: alerts.summary, observations: alerts.observations, createdAt: alerts.createdAt, scheduledFor: alerts.scheduledFor, readId: alertReads.id, readAt: alertReads.readAt }).from(alerts).leftJoin(alertReads, and(eq(alertReads.alertId, alerts.id), eq(alertReads.userId, userId))).where(lte(alerts.scheduledFor, new Date())).orderBy(desc(alerts.scheduledFor));
  return rows.map(row => ({ ...row, isRead: Boolean(row.readId), readAt: row.readAt }));
}

export async function getNextScheduledPublication() {
  const db = requiredDb(await getDb());
  return (await db.select({ scheduledFor: alerts.scheduledFor }).from(alerts).where(gt(alerts.scheduledFor, new Date())).orderBy(asc(alerts.scheduledFor)).limit(1))[0] ?? null;
}

export async function getAlertForUser(id: number, user: User) {
  const db = requiredDb(await getDb());
  const filter = user.role === "admin" ? eq(alerts.id, id) : and(eq(alerts.id, id), lte(alerts.scheduledFor, new Date()));
  const alert = (await db.select().from(alerts).where(filter).limit(1))[0];
  if (alert && user.role !== "admin" && !isAlertPublished(alert.scheduledFor)) return undefined;
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

export async function listAlertReaders(alertId: number) {
  const db = requiredDb(await getDb());
  return db.select({ id: users.id, name: users.name, username: users.username, sector: users.sector, role: users.role, readAt: alertReads.readAt }).from(users).leftJoin(alertReads, and(eq(alertReads.userId, users.id), eq(alertReads.alertId, alertId))).where(eq(users.role, "user")).orderBy(users.name);
}
