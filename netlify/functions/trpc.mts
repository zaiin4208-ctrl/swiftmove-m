import { handleTRPC } from "../../server/trpc";

export default async (request: Request) => {
  const url = new URL(request.url);
  const normalizedUrl = new URL(`/trpc${url.search}`, url.origin);
  const forwardedRequest = new Request(normalizedUrl, request);
  return handleTRPC(forwardedRequest);
};
