import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as pushDb from "./db";

export const pushRouter = router({
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await pushDb.upsertSubscription(ctx.user.id, input);
      return { success: true };
    }),

  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    await pushDb.deleteSubscription(ctx.user.id);
    return { success: true };
  }),

  getVapidPublicKey: publicProcedure.query(() => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? "" };
  }),

  status: protectedProcedure.query(async ({ ctx }) => {
    const sub = await pushDb.getSubscription(ctx.user.id);
    return { subscribed: Boolean(sub) };
  }),
});
