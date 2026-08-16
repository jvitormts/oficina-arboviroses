import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { LoginNotice } from "@/components/LoginNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { findArrivingAlert, shouldPollForAlerts, shouldShowAlertLoadError, shouldShowHighImpact } from "@/lib/alertPresentation";
import { notifyNewAlert } from "@/lib/notify";
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Eye, FileText, KeyRound, Loader2, LogIn, Pencil, Plus, ShieldAlert, Trash2, UsersRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type AlertItem = {
  id: number;
  title: string;
  summary: string;
  observations: string | null;
  createdAt: Date;
  scheduledFor: Date;
  isRead: boolean;
  readAt: Date | null;
};

type AdminAlert = Omit<AlertItem, "isRead" | "readAt"> & { createdBy: number; readCount: number };

const formatDate = (value: Date | string | null) => value
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const toDateTimeLocal = (value: Date | string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const ACCESS_GENERATED_KEY = "gve_access_generated";

function StatusChip({ read }: { read: boolean }) {
  return read ? (
    <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" />Lido</Badge>
  ) : (
    <Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100"><BellRing className="h-3.5 w-3.5" />Não lido</Badge>
  );
}

function InstitutionalLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [accessGenerated, setAccessGenerated] = useState(() => typeof window !== "undefined" && sessionStorage.getItem(ACCESS_GENERATED_KEY) === "1");
  const login = trpc.institutionalAuth.login.useMutation({
    onSuccess: () => window.location.assign("/"),
    onError: error => toast.error(error.message),
  });
  const generateAccess = trpc.institutionalAuth.generateAccess.useMutation({
    onSuccess: credentials => {
      sessionStorage.setItem(ACCESS_GENERATED_KEY, "1");
      setAccessGenerated(true);
      setGeneratedCredentials(credentials);
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="h-1.5 bg-[#ffcd07]" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-5">
          <div className="text-3xl font-black tracking-[-0.08em] text-[#1351b4]">GVE <span className="text-[#168821]">.</span></div>
          <div className="h-8 w-px bg-slate-300" />
          <div><p className="text-sm font-semibold text-slate-800">Prefeitura do Município</p><p className="text-xs text-slate-500">Vigilância em Saúde</p></div>
        </div>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-103px)] max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.1fr_.9fr]">
        <section className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#1351b4]"><ShieldAlert className="h-4 w-4" />Canal institucional de alertas</div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#071d41] sm:text-5xl">Alertas de Arboviroses</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">Acompanhe comunicados epidemiológicos relevantes para os setores de saúde do seu município. Alertas publicados são apresentados de forma simultânea, com confirmação individual de leitura.</p>
          <div className="mt-8 border-l-4 border-[#168821] bg-white px-5 py-4 shadow-sm"><p className="text-sm leading-6 text-slate-700"><strong>Uso restrito:</strong> esta plataforma é destinada às equipes e áreas responsáveis pela resposta municipal às arboviroses.</p></div>
        </section>
        <section className="rounded-sm border-t-4 border-[#1351b4] bg-white p-7 shadow-[0_10px_35px_rgba(7,29,65,.10)] sm:p-9">
          <div className="mb-7"><h2 className="text-2xl font-bold text-[#071d41]">Acesso institucional</h2><p className="mt-2 text-sm text-slate-600">Informe suas credenciais de acesso.</p></div>
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2"><Label htmlFor="username">Usuário</Label><Input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Digite seu usuário" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Sua senha" required /></div>
            <Button type="submit" className="h-11 w-full rounded-sm bg-[#1351b4] text-base hover:bg-[#0c3f8f]" disabled={login.isPending}>{login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}Entrar no sistema</Button>
          </form>
          <div className="mt-7 border-t pt-6">{accessGenerated ? <><p className="text-sm font-semibold text-slate-700">Credencial já gerada</p><p className="mt-1 text-xs leading-5 text-slate-500">Esta sessão já possui uma credencial individual. Entre com as credenciais que você anotou.</p></> : <><p className="text-sm font-semibold text-slate-700">Primeiro acesso?</p><p className="mt-1 text-xs leading-5 text-slate-500">Gere sua credencial individual antes de entrar. Anote os dados apresentados, pois a senha não será exibida novamente.</p><Button type="button" onClick={() => { setGeneratedCredentials(null); setGeneratorOpen(true); }} variant="outline" className="mt-4 w-full rounded-sm border-[#1351b4] text-[#1351b4] hover:bg-blue-50">Gerar acesso</Button></>}</div>
        </section>
      </main>
      <Dialog open={generatorOpen} onOpenChange={open => { setGeneratorOpen(open); if (!open) setGeneratedCredentials(null); }}><DialogContent className="max-w-md rounded-sm"><DialogHeader><DialogTitle className="text-[#071d41]">Gerar acesso individual</DialogTitle><DialogDescription>{generatedCredentials ? "Anote as credenciais abaixo antes de fechar esta janela." : "O sistema criará um usuário e uma senha exclusivos para esta pessoa."}</DialogDescription></DialogHeader>{generatedCredentials ? <div className="space-y-4 pt-3"><div className="rounded-sm border-l-4 border-[#1351b4] bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#1351b4]">Usuário</p><p className="mt-1 break-all font-mono text-lg font-bold text-[#071d41]">{generatedCredentials.username}</p></div><div className="rounded-sm border-l-4 border-[#168821] bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#168821]">Senha</p><p className="mt-1 break-all font-mono text-lg font-bold text-[#071d41]">{generatedCredentials.password}</p></div><p className="text-sm leading-6 text-slate-600"><strong>Atenção:</strong> guarde essas informações agora. Por segurança, a senha não será mostrada novamente.</p><Button type="button" onClick={() => { setUsername(generatedCredentials.username); setPassword(""); setGeneratorOpen(false); setGeneratedCredentials(null); }} className="w-full rounded-sm bg-[#1351b4] hover:bg-[#0c3f8f]">Já guardei minhas credenciais</Button></div> : <div className="space-y-5 pt-3"><p className="text-sm leading-6 text-slate-600">Ao continuar, será criado um acesso no formato <strong>usuario-XXXX</strong> e uma senha com palavra aleatória e dois números.</p><Button type="button" onClick={() => generateAccess.mutate()} disabled={generateAccess.isPending} className="w-full rounded-sm bg-[#1351b4] hover:bg-[#0c3f8f]">{generateAccess.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gerar minhas credenciais</Button></div>}</DialogContent></Dialog>
    </div>
  );
}

function AlertDetail({ alert, onClose }: { alert: AlertItem | null; onClose: () => void }) {
  return <Dialog open={Boolean(alert)} onOpenChange={open => !open && onClose()}>
    <DialogContent className="max-w-2xl rounded-sm p-0 overflow-hidden">
      {alert && <><div className="h-2 bg-[#1351b4]" /><div className="p-6 sm:p-8"><DialogHeader><div className="mb-3 flex items-center justify-between gap-3"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Comunicado epidemiológico</Badge><span className="text-xs text-slate-500">Publicado em {formatDate(alert.scheduledFor)}</span></div><DialogTitle className="text-2xl leading-tight text-[#071d41]">{alert.title}</DialogTitle></DialogHeader><div className="mt-4 max-h-[60vh] overflow-y-auto pr-1"><DialogDescription className="text-base leading-7 text-slate-700">{alert.summary}</DialogDescription>{alert.observations && <div className="mt-6 rounded-sm border-l-4 border-[#168821] bg-emerald-50/60 p-4"><h3 className="text-sm font-bold uppercase tracking-wide text-emerald-900">Orientações e observações</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{alert.observations}</p></div>}</div><div className="mt-7 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-[#168821]" />Leitura registrada em {formatDate(alert.readAt || new Date())}.</div></div></>}
    </DialogContent>
  </Dialog>;
}

function HighImpactNotice({ alert, onRead, onDismiss }: { alert: AlertItem; onRead: () => void; onDismiss: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071d41]/85 p-4" role="alertdialog" aria-modal="true" aria-labelledby="impact-title">
    <div className="w-full max-w-2xl overflow-hidden rounded-sm bg-white shadow-2xl"><div className="flex items-center gap-3 bg-[#c93400] px-6 py-4 text-white"><ShieldAlert className="h-7 w-7 shrink-0" /><div><p className="text-xs font-bold uppercase tracking-[.16em]">Novo alerta institucional</p><p className="text-sm opacity-90">Ação requerida para a rede de saúde</p></div></div><div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-6"><div><p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#c93400]">Atenção imediata</p><h2 id="impact-title" className="text-3xl font-extrabold leading-tight text-[#071d41]">{alert.title}</h2></div><button onClick={onDismiss} aria-label="Fechar aviso" className="rounded-sm p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 max-h-[50vh] overflow-y-auto pr-1"><p className="text-base leading-7 text-slate-700">{alert.summary}</p></div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={onDismiss} className="rounded-sm">Continuar no painel</Button><Button onClick={onRead} className="rounded-sm bg-[#1351b4] hover:bg-[#0c3f8f]"><Eye className="mr-2 h-4 w-4" />Ler comunicado</Button></div></div></div>
  </div>;
}

function SectorDashboard({ highImpactEnabled = true, canMarkRead = true }: { highImpactEnabled?: boolean; canMarkRead?: boolean }) {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [impactAlert, setImpactAlert] = useState<AlertItem | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const knownAlerts = useRef<Set<number> | null>(null);
  const alertsQuery = trpc.alerts.list.useQuery(undefined, { refetchInterval: shouldPollForAlerts(online), refetchOnWindowFocus: true, refetchOnReconnect: true });
  const nextPublicationQuery = trpc.alerts.nextPublication.useQuery(undefined, { refetchInterval: shouldPollForAlerts(online), refetchOnReconnect: true });
  const markRead = trpc.alerts.markRead.useMutation({ onSuccess: () => utils.alerts.list.invalidate() });
  const alerts = (alertsQuery.data ?? []) as AlertItem[];
  const showLoadError = shouldShowAlertLoadError(alertsQuery.isError, alerts.length > 0);

  useEffect(() => {
    const wentOffline = () => { setOnline(false); toast.warning("Conexão indisponível. A atualização de alertas será retomada quando a rede retornar."); };
    const cameOnline = () => { setOnline(true); toast.success("Conexão restabelecida. Verificando comunicados recentes..."); void alertsQuery.refetch(); };
    window.addEventListener("offline", wentOffline);
    window.addEventListener("online", cameOnline);
    return () => { window.removeEventListener("offline", wentOffline); window.removeEventListener("online", cameOnline); };
  }, [alertsQuery.refetch]);

  useEffect(() => {
    const scheduledFor = nextPublicationQuery.data?.scheduledFor;
    if (!online || !scheduledFor) return;
    const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now()) + 200;
    const releaseTimer = window.setTimeout(() => {
      void alertsQuery.refetch();
      void nextPublicationQuery.refetch();
    }, delay);
    return () => window.clearTimeout(releaseTimer);
  }, [alertsQuery.refetch, nextPublicationQuery.data?.scheduledFor, nextPublicationQuery.refetch, online]);

  useEffect(() => {
    if (alertsQuery.isLoading) return;
    const ids = new Set(alerts.map(alert => alert.id));
    if (knownAlerts.current === null) {
      knownAlerts.current = ids;
      return;
    }
    const arrival = findArrivingAlert(knownAlerts.current, alerts);
    if (arrival && highImpactEnabled) {
      notifyNewAlert();
      setImpactAlert(arrival);
    }
    knownAlerts.current = ids;
  }, [alerts, alertsQuery.isLoading, highImpactEnabled]);

  const openAlert = (alert: AlertItem) => {
    setSelected(alert);
    if (canMarkRead && !alert.isRead) markRead.mutate({ alertId: alert.id });
  };
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return <>
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="gov-hero rounded-sm px-6 py-7 text-white sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-100">Monitoramento institucional</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Comunicados recebidos</h1><p className="mt-2 max-w-xl text-blue-100">Alertas epidemiológicos publicados pela coordenação municipal de saúde.</p>{!online && <p className="mt-3 text-xs font-semibold text-[#ffcd07]">Atualização suspensa temporariamente: sem conexão.</p>}{alertsQuery.isError && online && <p className="mt-3 text-xs font-semibold text-[#ffcd07]">Não foi possível atualizar agora. Uma nova tentativa será feita automaticamente.</p>}</div><div className="flex min-w-32 items-center gap-3 rounded-sm border border-white/25 bg-white/10 px-4 py-3"><BellRing className="h-6 w-6 text-[#ffcd07]" /><div><p className="text-2xl font-bold leading-none">{unreadCount}</p><p className="mt-1 text-xs text-blue-100">não lidos</p></div></div></div></section>
      {alertsQuery.isLoading ? <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando comunicados...</div> : showLoadError ? <section role="alert" className="rounded-sm border border-red-200 bg-red-50 p-8 text-center"><AlertTriangle className="mx-auto h-9 w-9 text-red-700" /><h2 className="mt-3 text-lg font-bold text-[#071d41]">Não foi possível carregar os comunicados</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Verifique a conexão e tente novamente. O sistema retomará as atualizações assim que possível.</p><Button variant="outline" onClick={() => void alertsQuery.refetch()} className="mt-5 rounded-sm border-red-300 text-red-800 hover:bg-red-100">Tentar novamente</Button></section> : alerts.length === 0 ? <div className="rounded-sm border border-dashed border-slate-300 bg-white p-12 text-center"><ClipboardList className="mx-auto h-10 w-10 text-[#1351b4]" /><p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[#168821]">Monitoramento ativo</p><h2 className="mt-2 text-xl font-bold text-[#071d41]">Nenhum comunicado pendente</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">A rede permanece sem alertas epidemiológicos publicados neste momento.</p></div> : <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm"><div className="border-b bg-slate-50 px-6 py-4"><h2 className="font-bold text-[#071d41]">Central de alertas</h2></div><div>{alerts.map(alert => <button key={alert.id} onClick={() => openAlert(alert)} className={`group flex w-full items-start gap-4 border-b p-5 text-left last:border-b-0 hover:bg-blue-50/50 ${!alert.isRead ? "border-l-4 border-l-[#1351b4] bg-blue-50/20" : "border-l-4 border-l-transparent"}`}><div className={`mt-0.5 rounded-full p-2 ${alert.isRead ? "bg-slate-100 text-slate-500" : "bg-[#1351b4] text-white"}`}>{alert.isRead ? <CheckCircle2 className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#071d41]">{alert.title}</h3><StatusChip read={alert.isRead} /></div><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{alert.summary}</p><p className="mt-2 text-xs text-slate-500">Publicado em {formatDate(alert.scheduledFor)}{alert.readAt ? ` · Lido em ${formatDate(alert.readAt)}` : ""}</p></div><ChevronRight className="mt-3 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" /></button>)}</div></section>}
    </div>
    <AlertDetail alert={selected} onClose={() => setSelected(null)} />
    {impactAlert && <HighImpactNotice alert={impactAlert} onDismiss={() => setImpactAlert(null)} onRead={() => { setImpactAlert(null); openAlert(impactAlert); }} />}
  </>;
}

type AlertFormState = { title: string; summary: string; observations: string; scheduledFor: string };
const emptyAlertForm: AlertFormState = { title: "", summary: "", observations: "", scheduledFor: "" };

function AlertFormDialog({ current, onClose }: { current: AdminAlert | null | undefined; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<AlertFormState>(() => current ? { title: current.title, summary: current.summary, observations: current.observations ?? "", scheduledFor: toDateTimeLocal(current.scheduledFor) } : emptyAlertForm);
  const create = trpc.alerts.create.useMutation({ onSuccess: () => { toast.success("Alerta agendado com sucesso."); utils.alerts.adminList.invalidate(); onClose(); }, onError: error => toast.error(error.message) });
  const update = trpc.alerts.update.useMutation({ onSuccess: () => { toast.success("Alerta atualizado."); utils.alerts.adminList.invalidate(); onClose(); }, onError: error => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); const payload = { ...form, observations: form.observations || null, scheduledFor: new Date(form.scheduledFor) }; current ? update.mutate({ id: current.id, ...payload }) : create.mutate(payload); };
  const pending = create.isPending || update.isPending;
  return <Dialog open={current !== undefined} onOpenChange={open => !open && onClose()}><DialogContent className="max-w-2xl rounded-sm"><DialogHeader><DialogTitle className="text-[#071d41]">{current ? "Editar alerta" : "Novo alerta epidemiológico"}</DialogTitle><DialogDescription>Defina o conteúdo e a data/hora em que o comunicado ficará disponível para todos os setores.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5 pt-3"><div className="space-y-2"><Label htmlFor="alert-title">Título</Label><Input id="alert-title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} maxLength={180} required /></div><div className="space-y-2"><Label htmlFor="alert-summary">Explicação</Label><Textarea id="alert-summary" value={form.summary} onChange={event => setForm({ ...form, summary: event.target.value })} maxLength={2500} className="min-h-24" required /></div><div className="space-y-2"><Label htmlFor="alert-observations">Observações e orientações</Label><Textarea id="alert-observations" value={form.observations} onChange={event => setForm({ ...form, observations: event.target.value })} maxLength={5000} className="min-h-28" /></div><div className="space-y-2"><Label htmlFor="alert-scheduled">Data e hora de publicação</Label><Input id="alert-scheduled" type="datetime-local" value={form.scheduledFor} onChange={event => setForm({ ...form, scheduledFor: event.target.value })} required /></div><div className="flex justify-end gap-3 border-t pt-5"><Button type="button" variant="outline" onClick={onClose} className="rounded-sm">Cancelar</Button><Button type="submit" disabled={pending} className="rounded-sm bg-[#1351b4] hover:bg-[#0c3f8f]">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<CalendarClock className="mr-2 h-4 w-4" />{current ? "Salvar alterações" : "Agendar alerta"}</Button></div></form></DialogContent></Dialog>;
}

function ReadersDialog({ alert, onClose }: { alert: AdminAlert | null; onClose: () => void }) {
  const readers = trpc.alerts.readers.useQuery({ alertId: alert?.id ?? 0 }, { enabled: Boolean(alert) });
  return <Dialog open={Boolean(alert)} onOpenChange={open => !open && onClose()}><DialogContent className="max-w-2xl rounded-sm"><DialogHeader><DialogTitle className="text-[#071d41]">Confirmação de leitura</DialogTitle><DialogDescription>{alert?.title}</DialogDescription></DialogHeader><div className="max-h-96 overflow-y-auto pt-2">{readers.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : readers.data?.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nenhum usuário institucional cadastrado.</p> : <div className="divide-y rounded-sm border">{readers.data?.map((reader: { id: number; name: string | null; username: string | null; role: string; readAt: Date | null }) => <div key={reader.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold text-slate-800">{reader.name || reader.username || "Usuário institucional"}</p><p className="mt-1 text-xs text-slate-500">{reader.role === "admin" ? "Administrador" : "Usuário comum"}</p></div>{reader.readAt ? <div className="text-right"><StatusChip read /><p className="mt-1 text-xs text-slate-500">{formatDate(reader.readAt)}</p></div> : <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Pendente</Badge>}</div>)}</div>}</div></DialogContent></Dialog>;
}

function PasswordChangeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => { toast.success("Senha alterada com sucesso!"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); onClose(); },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("As senhas não conferem."); return; }
    changePassword.mutate({ currentPassword, newPassword });
  };
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-[#071d41]">Alterar senha</DialogTitle>
          <DialogDescription>Informe sua senha atual e defina uma nova senha.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="flex justify-end gap-3 border-t pt-5">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-sm">Cancelar</Button>
            <Button type="submit" disabled={changePassword.isPending} className="rounded-sm bg-[#1351b4] hover:bg-[#0c3f8f]">
              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar nova senha
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminDashboard() {
  const utils = trpc.useUtils();
  const alerts = trpc.alerts.adminList.useQuery();
  const [formAlert, setFormAlert] = useState<AdminAlert | null | undefined>(undefined);
  const [readerAlert, setReaderAlert] = useState<AdminAlert | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const remove = trpc.alerts.remove.useMutation({ onSuccess: () => { toast.success("Alerta excluído."); utils.alerts.adminList.invalidate(); }, onError: error => toast.error(error.message) });
  const allAlerts = (alerts.data ?? []) as AdminAlert[];
  const stats = useMemo(() => ({ scheduled: allAlerts.filter(alert => new Date(alert.scheduledFor) > new Date()).length, published: allAlerts.filter(alert => new Date(alert.scheduledFor) <= new Date()).length }), [allAlerts]);
  return <>
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-sm bg-[#071d41] px-6 py-7 text-white sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-blue-200">Coordenação de Vigilância em Saúde</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Gestão de alertas</h1><p className="mt-2 text-blue-100">Planeje publicações, acompanhe leituras e mantenha a rede de saúde informada.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setPasswordOpen(true)} className="rounded-sm border-white/30 text-white hover:bg-white/10 hover:text-white"><KeyRound className="mr-2 h-4 w-4" />Alterar senha</Button><Button onClick={() => setFormAlert(null)} className="rounded-sm bg-[#ffcd07] font-bold text-[#071d41] hover:bg-[#f0bb00]"><Plus className="mr-2 h-4 w-4" />Novo alerta</Button></div></div></section>
      <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-sm border-l-4 border-[#1351b4] bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Publicados</p><p className="mt-1 text-3xl font-bold text-[#071d41]">{stats.published}</p></div><div className="rounded-sm border-l-4 border-[#ffcd07] bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">Agendados</p><p className="mt-1 text-3xl font-bold text-[#071d41]">{stats.scheduled}</p></div></div>
      <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4"><div><h2 className="font-bold text-[#071d41]">Alertas cadastrados</h2><p className="text-xs text-slate-500">O total de leituras considera somente confirmações do usuário comum.</p></div></div>{alerts.isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : allAlerts.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto h-9 w-9 text-slate-400" /><p className="mt-3 text-sm text-slate-600">Ainda não há alertas cadastrados.</p></div> : <div className="divide-y">{allAlerts.map(alert => { const scheduled = new Date(alert.scheduledFor) > new Date(); return <div key={alert.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#071d41]">{alert.title}</h3><Badge className={scheduled ? "bg-amber-100 text-amber-900 hover:bg-amber-100" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"}>{scheduled ? "Agendado" : "Publicado"}</Badge><Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100"><UsersRound className="h-3.5 w-3.5" />{alert.readCount} {alert.readCount === 1 ? "leitura" : "leituras"}</Badge></div><p className="mt-1 line-clamp-1 text-sm text-slate-600">{alert.summary}</p><p className="mt-2 text-xs text-slate-500">Publicação: {formatDate(alert.scheduledFor)} · Criado: {formatDate(alert.createdAt)}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setReaderAlert(alert)} className="rounded-sm"><UsersRound className="mr-1.5 h-4 w-4" />Leituras</Button>{scheduled && <Button variant="outline" size="sm" onClick={() => setFormAlert(alert)} className="rounded-sm"><Pencil className="mr-1.5 h-4 w-4" />Editar</Button>}<Button variant="outline" size="sm" onClick={() => { if (window.confirm("Excluir este alerta? Esta ação não pode ser desfeita.")) remove.mutate({ id: alert.id }); }} className="rounded-sm border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="mr-1.5 h-4 w-4" />Excluir</Button></div></div>})}</div>}</section>
    </div>
    <AlertFormDialog current={formAlert} onClose={() => setFormAlert(undefined)} />
    <ReadersDialog alert={readerAlert} onClose={() => setReaderAlert(null)} />
    <PasswordChangeDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
  </>;
}

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [showNotice, setShowNotice] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("login_notice_shown") !== "1";
  });
  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando acesso...</div>;
  if (!isAuthenticated || !user) return <InstitutionalLogin />;
  const isAdmin = user.role === "admin";
  const page = isAdmin && location === "/administracao" ? <AdminDashboard /> : <SectorDashboard highImpactEnabled={shouldShowHighImpact(user.role as "admin" | "user" | undefined)} canMarkRead={user.role === "user"} />;
  return <DashboardLayout>{page}<LoginNotice open={showNotice} onClose={() => { sessionStorage.setItem("login_notice_shown", "1"); setShowNotice(false); }} /></DashboardLayout>;
}
