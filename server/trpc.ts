import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

const t = initTRPC.create();
const bookings: Array<Record<string, unknown>> = [];

export const appRouter = t.router({
  bookings: t.router({
    create: t.procedure
      .input(z.object({
        name: z.string().min(1), email: z.string().email(), phone: z.string().min(1),
        postcode: z.string().min(1), moveDate: z.string().optional(), moveTime: z.string().optional(),
        propertySize: z.string().min(1), packageLabel: z.string().min(1), fromAddress: z.string().optional(),
        toAddress: z.string().optional(), notes: z.string().optional(), depositAmount: z.number().positive(),
        cardLast4: z.string().optional(), cardBrand: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const booking = { id: bookings.length + 1, ...input, paymentStatus: "pending", status: "new", createdAt: new Date().toISOString() };
        bookings.push(booking);
        return booking;
      }),
  }),
});

export type AppRouter = typeof appRouter;

export function handleTRPC(req: Request) {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}
