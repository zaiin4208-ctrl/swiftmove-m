import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

const t = initTRPC.create();
const bookings: Array<Record<string, unknown>> = [];

const contactInput = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

const paymentIntentInput = z.object({
  bookingId: z.union([z.string(), z.number()]),
  amount: z.number().positive(),
});

const updatePaymentInput = z.object({
  bookingId: z.union([z.string(), z.number()]),
  paymentIntentId: z.string().trim().min(1).optional(),
  cardLast4: z.string().trim().min(4).max(4).optional(),
  cardBrand: z.string().trim().min(1).optional(),
  paymentStatus: z.string().trim().min(1).optional(),
});

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
    createPaymentIntent: t.procedure
      .input(paymentIntentInput)
      .mutation(({ input }) => ({
        id: `local_pi_${input.bookingId}`,
        clientSecret: `local_secret_${input.bookingId}`,
        amount: input.amount,
        status: "requires_payment_method" as const,
      })),
    updatePayment: t.procedure
      .input(updatePaymentInput)
      .mutation(({ input }) => {
        const booking = bookings.find((item) => String(item.id) === String(input.bookingId));
        if (booking) Object.assign(booking, input);
        return booking ?? { ...input, paymentStatus: input.paymentStatus ?? "pending" };
      }),
  }),
  contacts: t.router({
    create: t.procedure
      .input(contactInput)
      .mutation(({ input }) => ({ id: `local_contact_${Date.now()}`, ...input, createdAt: new Date().toISOString() })),
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
