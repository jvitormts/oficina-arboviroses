import { describe, expect, it } from "vitest";
import { hashPassword } from "./passwords";
import { canAuthenticateGeneratedAccess, reserveUniqueGeneratedAccess, summarizeIndividualReads } from "./individualAccess";

describe("acesso e rastreio individual", () => {
  it("autentica uma credencial individual gerada com a senha correspondente", () => {
    const hash = hashPassword("banana76");
    const storedUser = { username: "usuario-a9k2", passwordHash: hash };

    expect(canAuthenticateGeneratedAccess("usuario-a9k2", "banana76", storedUser)).toBe(true);
    expect(canAuthenticateGeneratedAccess("usuario-a9k2", "banana77", storedUser)).toBe(false);
  });

  it("gera novamente quando há colisão de identificador", async () => {
    const generated = [{ username: "usuario-ab12", password: "manga54" }, { username: "usuario-cd34", password: "limao62" }];
    let generatorCalls = 0;
    let persistCalls = 0;
    const result = await reserveUniqueGeneratedAccess(async () => {
      persistCalls += 1;
      if (persistCalls === 1) throw { code: "ER_DUP_ENTRY" };
    }, () => generated[generatorCalls++]!, 3);

    expect(result).toEqual({ username: "usuario-cd34", password: "limao62" });
    expect(persistCalls).toBe(2);
  });

  it("mantém leituras de usuários individuais separadas e soma confirmações únicas", () => {
    const summary = summarizeIndividualReads([
      { alertId: 7, userId: 12, readAt: new Date("2026-08-15T10:00:00Z") },
      { alertId: 7, userId: 18, readAt: new Date("2026-08-15T10:03:00Z") },
      { alertId: 7, userId: 12, readAt: new Date("2026-08-15T10:00:00Z") },
      { alertId: 8, userId: 24, readAt: new Date("2026-08-15T10:04:00Z") },
    ], 7);

    expect(summary.total).toBe(2);
    expect(summary.readers.map(reader => reader.userId)).toEqual([12, 18]);
  });
});
