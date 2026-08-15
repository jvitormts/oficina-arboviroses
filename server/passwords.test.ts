import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("credenciais institucionais", () => {
  it("aceita apenas a senha que originou o hash", () => {
    const hash = hashPassword("SaudeTaubate#2026");

    expect(verifyPassword("SaudeTaubate#2026", hash)).toBe(true);
    expect(verifyPassword("senha-incorreta", hash)).toBe(false);
  });

  it("rejeita hash ausente ou inválido", () => {
    expect(verifyPassword("qualquer-senha", null)).toBe(false);
    expect(verifyPassword("qualquer-senha", "formato-invalido")).toBe(false);
  });
});
