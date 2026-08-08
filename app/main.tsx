import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

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
        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
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
