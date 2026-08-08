import { useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "hsl(220 40% 10%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "16px",
      "::placeholder": { color: "hsl(215 18% 65%)" },
      iconColor: "hsl(218 85% 22%)",
    },
    invalid: { color: "hsl(0 84% 58%)" },
  },
};

interface CheckoutFormProps {
  amount: number;
  service: string;
  clientSecret: string;
  onSuccess: (paymentIntentId: string, paymentDetails?: { cardholderName: string; cardBrand?: string; cardLast4?: string; cardExpiry?: string }) => Promise<void> | void;
}

export function CheckoutForm({ amount, service, clientSecret, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ cardholderName: string; cardBrand?: string; cardLast4?: string; cardExpiry?: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || isProcessing) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber || !cardholderName.trim()) {
      setErrorMessage("Please enter the cardholder name and complete the card details.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name: cardholderName.trim() },
        },
      });

      if (error) {
        setErrorMessage(error.message ?? "Payment could not be completed.");
        return;
      }

      if (paymentIntent?.status !== "succeeded") {
        setErrorMessage("Payment is not complete yet. Please try again.");
        return;
      }

      // Store payment details for display
      const details = {
        cardholderName,
        cardBrand: (paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.brand,
        cardLast4: (paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.last4,
        cardExpiry: `${(paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.exp_month}/${(paymentIntent as any)?.charges?.data?.[0]?.payment_method_details?.card?.exp_year}`,
      };
      setPaymentDetails(details);

      await onSuccess(paymentIntent.id, details);
      setIsPaymentComplete(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment could not be completed.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isPaymentComplete) {
    return (
      <div className="space-y-4 py-6 text-center" data-testid="payment-success">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Payment confirmed</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your booking has been updated securely.</p>
          {paymentDetails && <p className="mt-2 text-xs text-muted-foreground">Card: {paymentDetails.cardLast4 ? `•••• ${paymentDetails.cardLast4}` : "•••• ••••"} · {paymentDetails.cardholderName}</p>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="secure-payment-form">
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Secure card payment</p>
          <p className="text-xs text-muted-foreground">
            Card details and bank verification are handled by Stripe and are not stored by SwiftMove.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Cardholder name
          <Input
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            autoComplete="cc-name"
            placeholder="Name on card"
            disabled={isProcessing}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Card number
          <div className="rounded-md border border-input bg-background px-3 py-3">
            <CardNumberElement options={CARD_ELEMENT_OPTIONS} onChange={(event) => setIsCardComplete(event.complete)} />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Expiry
            <div className="rounded-md border border-input bg-background px-3 py-3">
              <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            CVC
            <div className="rounded-md border border-input bg-background px-3 py-3">
              <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </label>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        type="submit"
        className="h-14 w-full rounded-xl text-base font-bold"
        disabled={!stripe || isProcessing || !isCardComplete}
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing securely…</>
        ) : (
          <><Lock className="mr-2 h-4 w-4" /> Pay £{(amount / 100).toFixed(2)}</>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        <span>{service} · Stripe may request bank verification when required.</span>
      </div>
    </form>
  );
}
