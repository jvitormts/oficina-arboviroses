import { describe, expect, it } from "vitest";
import { generateCredentials, isGeneratedUsername } from "./generatedCredentials";

describe("credenciais individuais geradas", () => {
  it("gera usuário com quatro caracteres alfanuméricos após o prefixo obrigatório", () => {
    const { username } = generateCredentials();
    expect(username).toMatch(/^usuario-[a-z0-9]{4}$/);
    expect(isGeneratedUsername(username)).toBe(true);
  });

  it("gera senha simples com palavra em minúsculas e dois dígitos", () => {
    const { password } = generateCredentials();
    expect(password).toMatch(/^[a-z]+\d{2}$/);
  });

  it("rejeita identificadores fora do formato permitido", () => {
    expect(isGeneratedUsername("usuario-12!x")).toBe(false);
    expect(isGeneratedUsername("usuario-ab12x")).toBe(false);
    expect(isGeneratedUsername("user-ab12")).toBe(false);
  });
});
