import * as db from "./db";
import { hashPassword } from "./passwords";

// Garante a existência da conta administrativa fixa. A senha vem de
// ADMIN_PASSWORD; na ausência, usa o valor padrão documentado no fluxo.
export async function ensureFixedAdmin(): Promise<void> {
  const existing = await db.getInstitutionalUserByUsername("admin");
  if (existing) return;

  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  await db.createInstitutionalUser({
    openId: "local:admin",
    name: "Administrador",
    username: "admin",
    passwordHash: hashPassword(password),
    sector: "Coordenação de Vigilância em Saúde",
    loginMethod: "institutional-password",
    role: "admin",
  });
}
