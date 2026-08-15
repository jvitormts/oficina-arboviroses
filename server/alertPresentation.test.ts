import { describe, expect, it } from "vitest";
import { findArrivingAlert, shouldPollForAlerts, shouldShowAlertLoadError, shouldShowHighImpact } from "../client/src/lib/alertPresentation";

describe("experiência de alertas em sessão aberta", () => {
  it("mostra aviso de alto impacto apenas para perfis de setor", () => {
    expect(shouldShowHighImpact("user")).toBe(true);
    expect(shouldShowHighImpact("admin")).toBe(false);
    expect(shouldShowHighImpact(undefined)).toBe(false);
  });

  it("suspende consultas periódicas sem conexão e as retoma ao reconectar", () => {
    expect(shouldPollForAlerts(false)).toBe(false);
    expect(shouldPollForAlerts(true)).toBe(15_000);
  });

  it("apresenta somente alertas que chegaram depois do carregamento inicial", () => {
    expect(findArrivingAlert(new Set([14, 18]), [{ id: 14 }, { id: 22 }])).toEqual({ id: 22 });
    expect(findArrivingAlert(null, [{ id: 22 }])).toBeUndefined();
  });

  it("expõe o estado de erro apenas quando não há alertas em cache", () => {
    expect(shouldShowAlertLoadError(true, false)).toBe(true);
    expect(shouldShowAlertLoadError(true, true)).toBe(false);
  });
});
