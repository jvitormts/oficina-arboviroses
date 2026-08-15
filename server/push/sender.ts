import webPush from "web-push";
import { getAllSubscriptions, deleteSubscription } from "./db";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    "mailto:alertas@taubate.sp.gov.br",
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string; userId: number }, payload: PushPayload): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) return false;
  try {
    await webPush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await deleteSubscription(subscription.userId);
    }
    return false;
  }
}

export async function broadcastPush(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured, skipping broadcast");
    return { sent: 0, failed: 0 };
  }
  const subscriptions = await getAllSubscriptions();
  let sent = 0;
  let failed = 0;
  for (const sub of subscriptions) {
    const ok = await sendPush(sub, payload);
    if (ok) sent++; else failed++;
  }
  return { sent, failed };
}
