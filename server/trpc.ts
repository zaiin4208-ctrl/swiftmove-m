import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

const t = initTRPC.create();
const bookings: Array<Record<string, unknown>> = [];

const bookingInput = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  moveDate: z.string().trim().min(1),
  moveTime: z.string().trim().min(1),
  propertySize: z.string().trim().min(1),
  packageLabel: z.string().trim().min(1),
  fromAddress: z.string().trim().min(1),
  toAddress: z.string().trim().min(1),
  notes: z.string().optional().default(""),
  depositAmount: z.number().positive(),
  cardLast4: z.string().optional(),
  cardBrand: z.string().optional(),
});

export const appRouter = t.router({
  bookings: t.router({
    create: t.procedure
      .input(bookingInput)
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
