import { eq } from "drizzle-orm";
import { pushSubscriptions } from "../../drizzle/schema";
import { getDb } from "../db";

export async function upsertSubscription(userId: number, data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  const db = await getDb();
  await db.insert(pushSubscriptions)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: pushSubscriptions.userId,
      set: {
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        updatedAt: new Date(),
      },
    });
}

export async function deleteSubscription(userId: number) {
  const db = await getDb();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function getSubscription(userId: number) {
  const db = await getDb();
  const result = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getAllSubscriptions() {
  const db = await getDb();
  return db.select().from(pushSubscriptions);
}
