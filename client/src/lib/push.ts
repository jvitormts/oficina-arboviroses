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
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service workers not supported");
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[Push] Service worker registered", reg.scope);
    return reg;
  } catch (err) {
    console.error("[Push] Service worker registration failed:", err);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("[Push] Notification API not supported");
    return false;
  }
  if (!("PushManager" in window)) {
    console.warn("[Push] PushManager not supported");
    return false;
  }
  const result = await Notification.requestPermission();
  console.log("[Push] Notification permission:", result);
  return result === "granted";
}

export async function subscribeToPush(
  subscribeFn: (data: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => Promise<unknown>
): Promise<boolean> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    console.log("[Push] Fetching VAPID public key...");
    const res = await fetch("/api/trpc/push.getVapidPublicKey", { credentials: "include" });
    const json = await res.json();
    console.log("[Push] Raw response:", JSON.stringify(json));
    const publicKey = json?.result?.data?.json?.publicKey ?? json?.result?.data?.publicKey;
    console.log("[Push] VAPID public key:", publicKey ? `${publicKey.substring(0, 10)}...` : "(empty)");
    if (!publicKey) {
      console.error("[Push] VAPID public key is empty. Check VAPID_PUBLIC_KEY env var.");
      return false;
    }

    console.log("[Push] Subscribing to push...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const { endpoint, keys } = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    console.log("[Push] Push subscription created, endpoint:", endpoint.substring(0, 50) + "...");

    console.log("[Push] Saving subscription to server...");
    await subscribeFn({ endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: navigator.userAgent });
    console.log("[Push] Subscription saved successfully");
    return true;
  } catch (err) {
    console.error("[Push] subscribeToPush failed:", err);
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
  } catch (err) {
    console.error("[Push] unsubscribeFromPush failed:", err);
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
