import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { alertsRouter } from "./routers/alerts";
import { institutionalAuthRouter } from "./routers/institutionalAuth";
import { pushRouter } from "./push/routers";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./passwords";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    changePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres.") }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getInstitutionalUserByUsername(ctx.user.username ?? "");
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
        }
        if (!verifyPassword(input.currentPassword, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
        }
        const newHash = hashPassword(input.newPassword);
        const updated = await db.updateUserPassword(user.id, newHash);
        if (!updated) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao atualizar senha." });
        }
        return { success: true };
      }),
  }),
  institutionalAuth: institutionalAuthRouter,
  alerts: alertsRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
