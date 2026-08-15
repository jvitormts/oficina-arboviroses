import { broadcastPush } from "./sender";

export async function notifyAlertPublished(alert: { id: number; title: string; summary: string }) {
  const payload = {
    title: `Alerta: ${alert.title}`,
    body: alert.summary.substring(0, 200),
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { alertId: alert.id, url: "/" },
  };

  const result = await broadcastPush(payload);
  console.log(`[Push] Alert ${alert.id}: ${result.sent} sent, ${result.failed} failed`);
  return result;
}
