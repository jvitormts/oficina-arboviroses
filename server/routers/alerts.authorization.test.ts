import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { alertsRouter } from "./alerts";

function sectorContext(): TrpcContext {
  return {
    user: {
      id: 12,
      openId: "local:vigilancia.epidemiologica",
      name: "Vigilância Epidemiológica",
      email: null,
      username: "vigilancia.epidemiologica",
      passwordHash: "hash",
      sector: "Vigilância Epidemiológica",
      loginMethod: "institutional-password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("autorização de alertas", () => {
  it("impede que usuários de setores acessem o gerenciamento administrativo", async () => {
    const caller = alertsRouter.createCaller(sectorContext());

    await expect(caller.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede que uma sessão administrativa confirme a leitura", async () => {
    const ctx = sectorContext();
    ctx.user = { ...ctx.user!, role: "admin" };
    const caller = alertsRouter.createCaller(ctx);

    await expect(caller.markRead({ alertId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
