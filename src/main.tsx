import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// Chromium reports this benign warning when a responsive component settles
// across multiple layout frames. It is not an application failure, so keep it
// out of the preview error surface without hiding unrelated runtime errors.
window.addEventListener("error", (event) => {
  if (event.message === "ResizeObserver loop completed with undelivered notifications.") {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

// VITE_TRPC_URL overrides the default (set to /trpc on Netlify, or any external URL)
const apiBase =
  import.meta.env.VITE_TRPC_URL ||
  `${window.location.origin}/api-server/api/trpc`;

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiBase,
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" }).then(async response => {
          if (response.ok) return response;
          const raw = await response.text();
          let message = `Request failed (${response.status})`;
          if (raw.trim()) {
            try {
              const payload = JSON.parse(raw) as { error?: { json?: { message?: string }; message?: string } };
              message = payload.error?.json?.message ?? payload.error?.message ?? raw;
            } catch {
              message = raw.slice(0, 240);
            }
          }
          throw new Error(message);
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
