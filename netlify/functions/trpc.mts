import { handleTRPC } from "../../server/trpc";

export default async (request: Request) => handleTRPC(request);

export const config = { path: "/trpc/*" };
