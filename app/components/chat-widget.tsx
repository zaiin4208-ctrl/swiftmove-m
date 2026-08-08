import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, Phone, Send, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ref, push, onValue, set } from "firebase/database";
import { doc, onSnapshot } from "firebase/firestore";
import { visitorRtdb, visitorDb } from "@/lib/firebase-visitor";

// ─── Types ─────────────────────────────────────────────────────────────────
type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
  isAgent?: boolean;
  rtdbKey?: string;
};

function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, from: "bot", text: "👋 Hi! Welcome to SwiftMove & Clean. How can we help you today?", time: now() },
  { id: 2, from: "bot", text: "We can usually have a team at your door within 20 minutes of booking. 🚛", time: now() },
];

const QUICK_REPLIES = [
  "Get a price quote",
  "How does it work?",
  "Track my booking",
  "Talk to someone",
];

const BOT_RESPONSES: Record<string, string> = {
  "Get a price quote": "Great! Our prices start from £299 for a Studio/1-Bed. You can book online in under 2 minutes 👉 Just click 'Book Now' and choose your property size.",
  "How does it work?": "It's simple! 1️⃣ Choose your package online 2️⃣ Pay a small deposit 3️⃣ Your team arrives within 20 minutes — fully equipped and ready to go!",
  "Track my booking": "To track your booking, please call us on +1 948 223 2328 and we'll give you a live update on your team's location.",
  "Talk to someone": "Of course! You can reach us right now:\n📞 Call: +1 948 223 2328\n✉️ Email: helloswiftmoveandclean.co.uk@cutsup.com",
};

const SESSION_KEY = "swiftmove_fid";

// ─── Component ─────────────────────────────────────────────────────────────
export function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]       = useState("");
  const [showDot, setShowDot]   = useState(true);
  const [typing, setTyping]     = useState(false);
  const [chatDocId, setChatDocId] = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const shownAgentKeys          = useRef<Set<string>>(new Set());

  // ── Resolve visitor doc ID (set by useFirebaseTracking on page load) ───
  useEffect(() => {
    const resolve = () => {
      const id = sessionStorage.getItem(SESSION_KEY);
      if (id) { setChatDocId(id); return true; }
      return false;
    };
    if (resolve()) return;
    const interval = setInterval(() => { if (resolve()) clearInterval(interval); }, 600);
    return () => clearInterval(interval);
  }, []);

  // ── PRIMARY: Firestore onSnapshot for agent replies ────────────────────
  // Visitors are unauthenticated and cannot READ from RTDB, but Firestore
  // allows unauthenticated access. The dashboard writes agent replies to
  // pays/{visitorId}.chatAgentMsgs.{key} — we listen here to receive them.
  useEffect(() => {
    if (!chatDocId) return;

    const docRef = doc(visitorDb, "pays", chatDocId);
    const unsub = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      const agentMsgs = data?.chatAgentMsgs as Record<string, { text: string; timestamp: number; key: string }> | undefined;
      if (!agentMsgs) return;

      const newReplies: Message[] = Object.entries(agentMsgs)
        .filter(([key]) => !shownAgentKeys.current.has(key))
        .sort(([, a], [, b]) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
        .map(([key, m]) => {
          shownAgentKeys.current.add(key);
          return {
            id: m.timestamp ?? Date.now(),
            from: "bot" as const,
            text: m.text,
            time: new Date(m.timestamp ?? Date.now()).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            isAgent: true,
          };
        });

      if (newReplies.length > 0) {
        setMessages(prev => [...prev, ...newReplies]);
        if (!open) setShowDot(true);
      }
    }, (err) => {
      // Firestore read failed — log only in dev, don't crash the widget
      if (import.meta.env.DEV) console.warn("[chat] Firestore snapshot error:", err);
    });

    return () => unsub();
  }, [chatDocId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SECONDARY: RTDB listener (works if RTDB rules allow unauth read) ──
  // Kept as backup; silently a no-op if permissions are denied.
  useEffect(() => {
    if (!chatDocId) return;

    const msgRef = ref(visitorRtdb, `chats/${chatDocId}/messages`);
    const unsub = onValue(
      msgRef,
      (snap) => {
        const data = snap.val() as Record<string, any> | null;
        if (!data) return;

        const newReplies: Message[] = Object.entries(data)
          .filter(([, m]) => m.from === "agent")
          .sort(([, a], [, b]) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
          .filter(([key]) => !shownAgentKeys.current.has(key))
          .map(([key, m]) => {
            shownAgentKeys.current.add(key);
            return {
              id: m.timestamp ?? Date.now(),
              from: "bot" as const,
              text: m.text,
              time: new Date(m.timestamp ?? Date.now()).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              isAgent: true,
            };
          });

        if (newReplies.length > 0) {
          setMessages(prev => [...prev, ...newReplies]);
          if (!open) setShowDot(true);
        }
      },
      () => { /* RTDB read denied — Firestore listener above covers delivery */ },
    );

    return () => unsub();
  }, [chatDocId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setShowDot(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Send a message ────────────────────────────────────────────────────
  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now(), from: "user", text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Push to Firebase RTDB so dashboard sees it instantly
    if (chatDocId) {
      const ts = Date.now();
      push(ref(visitorRtdb, `chats/${chatDocId}/messages`), {
        text,
        from: "user",
        timestamp: ts,
        read: false,
      });
      set(ref(visitorRtdb, `chats/${chatDocId}/meta`), {
        lastMessage: text,
        lastMessageAt: ts,
        unread: true,
        visitorId: chatDocId,
      });
    }

    // Bot fallback (keeps immediate UX for predefined quick replies)
    const reply = BOT_RESPONSES[text];
    if (reply) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { id: Date.now() + 1, from: "bot", text: reply, time: now() }]);
      }, 1200);
    } else {
      // For free-text messages: show typing briefly, then a "we'll reply shortly" message
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "bot",
            text: "Thanks! Our team will reply shortly. For urgent help, call us on +1 948 223 2328. 👍",
            time: now(),
          },
        ]);
      }, 1200);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_24px_rgba(16,30,100,0.35)] transition-all hover:scale-105 hover:shadow-[0_8px_32px_rgba(16,30,100,0.45)] focus:outline-none"
        aria-label="Open support chat"
        data-testid="button-chat-toggle"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle className="h-7 w-7" />
            </motion.div>
          )}
        </AnimatePresence>
        {showDot && !open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">1</span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-[360px] rounded-2xl overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.25)] flex flex-col"
            style={{ maxHeight: "min(520px, calc(100vh - 120px))" }}
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-serif font-black text-xl text-white shrink-0">S</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm">SwiftMove Support</div>
                <div className="flex items-center gap-1.5 text-xs text-blue-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 pulse-gentle" />
                  Online now
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
              <p className="text-center text-[11px] text-gray-400 font-medium">SwiftMove & Clean Support Chat</p>

              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "bot" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs mr-2 mt-1">S</div>
                  )}
                  <div className={`max-w-[78%] ${msg.from === "user" ? "" : ""}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`text-[10px] text-gray-400 mt-1 ${msg.from === "user" ? "text-right" : "text-left"}`}>{msg.time}</div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">S</div>
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="bg-gray-50 px-4 pb-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="shrink-0 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0">
              <a
                href="tel:+19482232328"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                title="Call us"
              >
                <Phone className="h-4 w-4" />
              </a>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Footer links */}
            <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between shrink-0">
              <a href="tel:+19482232328" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors">
                <Phone className="h-3 w-3" /> +1 948 223 2328
              </a>
              <Link href="/book" onClick={() => setOpen(false)} className="text-xs font-bold text-primary hover:underline">
                Book now →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
