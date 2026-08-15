import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { requestPushPermission, subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PushNotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const subscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => { setIsEnabled(true); toast.success("Notificações ativadas!"); },
    onError: (err) => { console.error("[Push] Server subscribe failed:", err); toast.error("Erro ao ativar: " + err.message); },
  });

  const unsubscribeMutation = trpc.push.unsubscribe.useMutation({
    onSuccess: () => { setIsEnabled(false); toast.success("Notificações desativadas"); },
    onError: (err) => toast.error("Erro ao desativar: " + err.message),
  });

  useEffect(() => {
    isPushSubscribed().then(setIsEnabled).finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async () => {
    if (isEnabled) {
      await unsubscribeFromPush(() => unsubscribeMutation.mutateAsync());
    } else {
      const granted = await requestPushPermission();
      if (!granted) { toast.warning("Permissão de notificações negada"); return; }
      const ok = await subscribeToPush((data) => subscribeMutation.mutateAsync(data));
      if (!ok) { toast.error("Falha ao ativar notificações. Verifique o console do navegador."); }
    }
  };

  if (isLoading || !("Notification" in window) || !("serviceWorker" in navigator)) return null;

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle}
      disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
      className="gap-1.5 text-xs">
      {isEnabled ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {isEnabled ? "Desativar" : "Ativar"}
    </Button>
  );
}
