export function extractBookingId(result: unknown): number | null {
  if (Array.isArray(result)) {
    return extractBookingId(result[0]);
  }

  if (!result || typeof result !== "object") return null;

  const record = result as Record<string, unknown>;
  const rawId = record.insertId ?? record.id;

  if (typeof rawId === "bigint") {
    const value = Number(rawId);
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof rawId === "number") {
    return Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null;
  }

  if (typeof rawId === "string" && /^\d+$/.test(rawId)) {
    const value = Number(rawId);
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  return null;
}

export function normalizeDepositAmount(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function resolveBookingPaymentContext(result: unknown, amount: unknown) {
  const bookingId = extractBookingId(result);
  if (!bookingId) {
    throw new Error("Booking was created without a valid booking ID. Please try again.");
  }

  const normalizedAmount = normalizeDepositAmount(amount);
  if (!normalizedAmount) {
    throw new Error("The selected package has an invalid deposit amount. Please choose the package again.");
  }

  return { bookingId, amount: normalizedAmount };
}

export function isCheckoutReady(input: {
  clientSecret: string | null;
  stripeLoaded: boolean;
  bookingId: unknown;
  amount: unknown;
}): boolean {
  return Boolean(
    input.clientSecret &&
      input.stripeLoaded &&
      extractBookingId({ id: input.bookingId }) &&
      normalizeDepositAmount(input.amount),
  );
}

export async function createPaymentIntentWhenReady(input: {
  bookingResult: unknown;
  amount: unknown;
  service: string;
  createPaymentIntent: (request: {
    amount: number;
    service: string;
    bookingId: number;
  }) => Promise<{ clientSecret: string | null }>;
}) {
  const context = resolveBookingPaymentContext(input.bookingResult, input.amount);
  const result = await input.createPaymentIntent({
    amount: context.amount,
    service: input.service,
    bookingId: context.bookingId,
  });

  if (!result.clientSecret) {
    throw new Error("Payment could not be prepared. Please submit your booking again.");
  }

  return { ...context, clientSecret: result.clientSecret };
}

type BookingConfirmationCopySource = {
  confirmedHeading: string;
  arrivingBadge: string;
  confirmedMsg: string;
  depositPaid: string;
  pendingPaymentHeading: string;
  pendingPaymentBadge: string;
  pendingPaymentMsg: string;
  paymentPending: string;
};

export function getBookingConfirmationCopy(
  paymentCompleted: boolean,
  copy: BookingConfirmationCopySource,
) {
  return paymentCompleted
    ? {
        heading: copy.confirmedHeading,
        badge: copy.arrivingBadge,
        message: copy.confirmedMsg,
        paymentStatus: copy.depositPaid,
        statusTone: "paid" as const,
      }
    : {
        heading: copy.pendingPaymentHeading,
        badge: copy.pendingPaymentBadge,
        message: copy.pendingPaymentMsg,
        paymentStatus: copy.paymentPending,
        statusTone: "pending" as const,
      };
}
