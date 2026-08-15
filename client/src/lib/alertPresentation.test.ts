import { describe, expect, it } from "vitest";
import { findArrivingAlert, shouldPollForAlerts, shouldShowHighImpact } from "./alertPresentation";

describe("apresentação de alertas", () => {
  it("reserva o aviso de alto impacto a usuários de setores", () => {
    expect(shouldShowHighImpact("user")).toBe(true);
    expect(shouldShowHighImpact("admin")).toBe(false);
  });

  it("interrompe a consulta periódica quando a conexão está indisponível", () => {
    expect(shouldPollForAlerts(true)).toBe(15_000);
    expect(shouldPollForAlerts(false)).toBe(false);
  });

  it("identifica apenas alertas que chegaram após o estado conhecido", () => {
    const known = new Set([1, 2]);
    expect(findArrivingAlert(known, [{ id: 1 }, { id: 3 }])).toEqual({ id: 3 });
    expect(findArrivingAlert(null, [{ id: 3 }])).toBeUndefined();
  });
});
