import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { hashPassword } from "../passwords";
import { isFixedInstitutionalUsername } from "../fixedAccounts";

export const usersRouter = router({
  list: adminProcedure.query(async () => db.listInstitutionalUsers()),

  create: adminProcedure
    .input(z.object({
      name: z.string().trim().min(3).max(160),
      username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,80}$/, "Use letras, números, ponto, hífen ou sublinhado."),
      password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(160),
      sector: z.string().trim().min(3).max(180),
      role: z.enum(["admin", "user"]),
    }))
    .mutation(async ({ input }) => {
      throw new TRPCError({ code: "FORBIDDEN", message: "Novos acessos são gerados exclusivamente pela página inicial do sistema." });
      const exists = await db.getInstitutionalUserByUsername(input.username);
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "Este nome de usuário já está em uso." });
      return db.createInstitutionalUser({
        openId: `local:${input.username}`,
        name: input.name,
        username: input.username,
        passwordHash: hashPassword(input.password),
        sector: input.sector,
        role: input.role,
        loginMethod: "institutional-password",
      });
    }),
});
