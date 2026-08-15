export function shouldShowHighImpact(role: "admin" | "user" | undefined): boolean {
  return role === "user";
}

export function shouldPollForAlerts(isOnline: boolean): number | false {
  return isOnline ? 15_000 : false;
}

export function findArrivingAlert<T extends { id: number }>(knownIds: Set<number> | null, alerts: T[]): T | undefined {
  if (!knownIds) return undefined;
  return alerts.find(alert => !knownIds.has(alert.id));
}

export function shouldShowAlertLoadError(isError: boolean, hasCachedAlerts: boolean): boolean {
  return isError && !hasCachedAlerts;
}
