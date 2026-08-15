import { z } from "zod";
import { COOKIE_NAME, CREDENTIAL_GENERATED_COOKIE, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { verifyPassword } from "../passwords";
import { sdk } from "../_core/sdk";
import { TRPCError } from "@trpc/server";
import { isFixedInstitutionalUsername } from "../fixedAccounts";
import { isGeneratedUsername } from "../generatedCredentials";
import { canAuthenticateGeneratedAccess, reserveUniqueGeneratedAccess } from "../individualAccess";

export const institutionalAuthRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string().trim().min(3).max(80), password: z.string().min(1).max(160) }))
    .mutation(async ({ ctx, input }) => {
      const normalizedUsername = input.username.toLowerCase();
      if (!isFixedInstitutionalUsername(normalizedUsername) && !isGeneratedUsername(normalizedUsername)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha não conferem." });
      }
      const user = await db.getInstitutionalUserByUsername(normalizedUsername);
      const validPassword = isFixedInstitutionalUsername(normalizedUsername)
        ? verifyPassword(input.password, user?.passwordHash ?? null)
        : canAuthenticateGeneratedAccess(normalizedUsername, input.password, user);
      if (!user || !validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha não conferem." });
      }

      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? input.username });
      ctx.res.cookie(COOKIE_NAME, token, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: ONE_YEAR_MS,
      });
      return { success: true, role: user.role };
    }),

  generateAccess: publicProcedure.mutation(async ({ ctx }) => {
    const cookies = parseCookieHeader(ctx.req.headers.cookie ?? "");
    if (cookies[CREDENTIAL_GENERATED_COOKIE]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Uma credencial já foi gerada nesta sessão. Utilize as credenciais que você anotou para entrar.",
      });
    }
    const access = await reserveUniqueGeneratedAccess(async access => {
      await db.createInstitutionalUser({
        openId: `local:${access.username}`,
        name: access.username,
        username: access.username,
        passwordHash: access.passwordHash,
        sector: null,
        loginMethod: "generated-individual-access",
        role: "user",
      });
    });
    ctx.res.cookie(CREDENTIAL_GENERATED_COOKIE, "1", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: getSessionCookieOptions(ctx.req).secure,
    });
    return access;
  }),
});
