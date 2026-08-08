import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";

// Using AnyRouter since AppRouter type lives in api-server (separate package).
// All mutations/queries work correctly at runtime.
export const trpc = createTRPCReact<AnyRouter>();
