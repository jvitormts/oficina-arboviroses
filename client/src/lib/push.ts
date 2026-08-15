function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window) || !("PushManager" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function subscribeToPush(
  subscribeFn: (data: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => Promise<unknown>
): Promise<boolean> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    const res = await fetch("/api/trpc/push.getVapidPublicKey");
    const json = await res.json();
    const publicKey = json?.result?.data?.publicKey;
    if (!publicKey) return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const { endpoint, keys } = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await subscribeFn({ endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: navigator.userAgent });
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(
  unsubscribeFn: () => Promise<unknown>
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;
    await subscription.unsubscribe();
    await unsubscribeFn();
    return true;
  } catch {
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}
