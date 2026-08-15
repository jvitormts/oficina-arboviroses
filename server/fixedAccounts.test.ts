import { describe, expect, it } from "vitest";
import { isFixedInstitutionalOpenId, isFixedInstitutionalUsername } from "./fixedAccounts";

describe("acesso administrativo e sessões individuais", () => {
  it("mantém somente o administrador como acesso fixo", () => {
    expect(isFixedInstitutionalUsername("admin")).toBe(true);
    expect(isFixedInstitutionalUsername("user")).toBe(false);
    expect(isFixedInstitutionalUsername("vigilancia")).toBe(false);
  });

  it("aceita sessão administrativa e sessões individuais geradas", () => {
    expect(isFixedInstitutionalOpenId("local:admin")).toBe(true);
    expect(isFixedInstitutionalOpenId("local:usuario-ab12")).toBe(true);
    expect(isFixedInstitutionalOpenId("local:user")).toBe(false);
    expect(isFixedInstitutionalOpenId("local:other")).toBe(false);
  });
});
