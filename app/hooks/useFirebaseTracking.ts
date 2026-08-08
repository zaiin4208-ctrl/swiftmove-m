import { useEffect, useRef, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { visitorDb, visitorRtdb } from "@/lib/firebase-visitor";

// ──────────────────────────────────────────────────────────────────────────────
// Module-level singletons so the doc is only created once per page load,
// even if the hook is called from multiple components.
// ──────────────────────────────────────────────────────────────────────────────
const SESSION_KEY = "swiftmove_fid";
let _globalDocId: string | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _initPromise: Promise<string> | null = null;

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  return {
    deviceType: /Mobile|Android|iPhone|iPad/.test(ua) ? "mobile" : "desktop",
    browser: /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
      ? "Firefox"
      : /Safari/.test(ua)
      ? "Safari"
      : "Other",
    os: /Windows/.test(ua)
      ? "Windows"
      : /Mac/.test(ua)
      ? "Mac"
      : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
      ? "iOS"
      : "Other",
  };
};

async function createOrRestoreVisitorDoc(): Promise<string> {
  // Try to restore existing session doc
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const snap = await getDoc(doc(visitorDb, "pays", stored));
      if (snap.exists()) {
        _globalDocId = stored;
        return stored;
      }
    } catch {
      // doc was deleted – create a fresh one below
    }
  }

  const { deviceType, browser, os } = getDeviceInfo();
  const referenceNumber = `SM-${Date.now()}`;

  const docRef = await addDoc(collection(visitorDb, "pays"), {
    // Fields that make the record visible in swiftmove-L dashboard
    ownerName: "",
    phoneNumber: "",
    country: "UK",
    referenceNumber,

    // Required by InsuranceApplication type (dashboard won't crash)
    documentType: "بطاقة جمركية",
    serialNumber: "",
    insuranceType: "تأمين جديد",
    insuranceCoverage: "",
    insuranceStartDate: new Date().toISOString().split("T")[0],
    vehicleUsage: "",
    vehicleValue: "",
    vehicleYear: "",
    vehicleModel: "",
    repairLocation: "agency",
    paymentStatus: "pending",
    status: "draft",

    // Tracking fields
    isOnline: true,
    online: true,
    lastActiveAt: new Date().toISOString(),
    sessionStartAt: new Date().toISOString(),
    deviceType,
    browser,
    os,
    currentPage: "home",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  _globalDocId = docRef.id;
  sessionStorage.setItem(SESSION_KEY, docRef.id);
  return docRef.id;
}

async function setupRtdbPresence(docId: string) {
  const presenceRef = ref(visitorRtdb, `presence/${docId}`);
  const connectedRef = ref(visitorRtdb, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;

    // Register disconnect handler BEFORE marking online
    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: rtdbServerTimestamp(),
    });

    // Mark online in Realtime DB
    set(presenceRef, { online: true, lastSeen: Date.now() });

    // Mark online in Firestore
    updateDoc(doc(visitorDb, "pays", docId), {
      isOnline: true,
      online: true,
      lastActiveAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  });
}

async function sendHeartbeat(docId: string) {
  try {
    await updateDoc(doc(visitorDb, "pays", docId), {
      lastActiveAt: new Date().toISOString(),
      isOnline: true,
      online: true,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Network issues – silent fail, retry on next tick
  }
}

async function initTracking(): Promise<string> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const docId = await createOrRestoreVisitorDoc();
    await setupRtdbPresence(docId);
    await sendHeartbeat(docId);

    if (_heartbeatTimer) clearInterval(_heartbeatTimer);
    _heartbeatTimer = setInterval(() => sendHeartbeat(docId), 25_000);

    return docId;
  })();

  return _initPromise;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public hook
// ──────────────────────────────────────────────────────────────────────────────
export function useFirebaseTracking(_userId?: string) {
  const docIdRef = useRef<string | null>(_globalDocId);

  useEffect(() => {
    initTracking()
      .then((id) => {
        docIdRef.current = id;
      })
      .catch(console.error);

    return () => {
      // Cleanup only when the entire app unmounts (not on re-renders)
      if (_heartbeatTimer) {
        clearInterval(_heartbeatTimer);
        _heartbeatTimer = null;
      }
      _initPromise = null;
      _globalDocId = null;
    };
  }, []);

  // ── trackEvent ────────────────────────────────────────────────────────────
  const trackEvent = useCallback(
    (_name: string, _data?: Record<string, unknown>) => {
      // Events are captured through saveBookingStep; no extra write needed.
    },
    [],
  );

  // ── saveBookingStep ───────────────────────────────────────────────────────
  const saveBookingStep = useCallback(
    async (step: string, data?: Record<string, unknown>) => {
      const docId = docIdRef.current ?? _globalDocId;
      if (!docId) return;

      try {
        const updates: Record<string, unknown> = {
          currentPage: step,
          lastActiveAt: new Date().toISOString(),
          isOnline: true,
          online: true,
          updatedAt: serverTimestamp(),
        };

        // ── Map each known step to Firestore fields ────────────────────────
        if (data) {
          switch (step) {
            case "details_filled":
              // Visitor filled their name / phone / email → now visible in dashboard
              updates.ownerName   = data.name ?? "";
              updates.phoneNumber = data.phone ?? "";
              updates.email       = data.email ?? "";
              updates.postcode    = data.postcode ?? "";
              // Full address strings
              updates.fromAddress = data.fromAddress ?? "";
              updates.toAddress   = data.toAddress ?? "";
              // Individual address components
              updates.fromLine1    = data.fromLine1 ?? "";
              updates.fromLine2    = data.fromLine2 ?? "";
              updates.fromCity     = data.fromCity ?? "";
              updates.fromPostcode = data.fromPostcode ?? "";
              updates.toLine1      = data.toLine1 ?? "";
              updates.toLine2      = data.toLine2 ?? "";
              updates.toCity       = data.toCity ?? "";
              updates.toPostcode   = data.toPostcode ?? "";
              // Move details
              updates.moveDate     = data.moveDate ?? "";
              updates.moveTime     = data.moveTime ?? "";
              updates.notes        = data.notes ?? "";
              // Package info
              if (data.packageLabel)  updates.packageLabel  = data.packageLabel;
              if (data.packagePrice)  updates.packagePrice  = data.packagePrice;
              if (data.depositAmount) updates.depositAmount = data.depositAmount;
              updates.status = "pending_review";
              break;

            case "booking_created":
              updates.bookingId = data.bookingId;
              updates.status = "pending_review";
              updates.isUnread = true;
              break;

            case "payment_verified":
              updates.paymentStatus = "completed";
              updates.status = "completed";
              if (data.cardLast4) updates.cardLast4 = data.cardLast4;
              if (data.cardBrand) updates.cardBrand = data.cardBrand;
              break;

            case "package_selected":
              updates.packageLabel = data.package;
              updates.packagePrice = data.price;
              break;

            default:
              // For other steps, merge data as-is
              Object.assign(updates, data);
              break;
          }
        }

        await updateDoc(doc(visitorDb, "pays", docId), updates);
      } catch (err) {
        console.error("[SwiftMove tracking] saveBookingStep error:", err);
      }
    },
    [],
  );

  return { trackEvent, saveBookingStep };
}
