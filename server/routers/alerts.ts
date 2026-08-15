import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const alertInput = z.object({
  title: z.string().trim().min(5, "Informe um título com pelo menos 5 caracteres.").max(180),
  summary: z.string().trim().min(10, "Informe um resumo com pelo menos 10 caracteres.").max(600),
  observations: z.string().trim().max(5000).optional().nullable(),
  scheduledFor: z.coerce.date(),
});

export const alertsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.listPublishedAlertsForUser(ctx.user.id);
  }),

  nextPublication: protectedProcedure.query(async () => {
    return db.getNextScheduledPublication();
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const alert = await db.getAlertForUser(input.id, ctx.user);
      if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "Alerta não encontrado ou ainda não publicado." });
      return alert;
    }),

  markRead: protectedProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "user") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Somente o usuário comum pode confirmar a leitura de alertas." });
      }
      const alert = await db.getAlertForUser(input.alertId, ctx.user);
      if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "O alerta ainda não está disponível." });
      return db.markAlertRead(input.alertId, ctx.user.id);
    }),

  adminList: adminProcedure.query(async () => db.listAllAlerts()),

  create: adminProcedure.input(alertInput).mutation(async ({ ctx, input }) => {
    return db.createAlert({ ...input, createdBy: ctx.user.id });
  }),

  update: adminProcedure
    .input(alertInput.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id, ...changes } = input;
      const result = await db.updateAlert(id, changes);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Alerta não encontrado." });
      return result;
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const deleted = await db.deleteAlert(input.id);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Alerta não encontrado." });
      return { success: true };
    }),

  readers: adminProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .query(async ({ input }) => db.listAlertReaders(input.alertId)),
});
