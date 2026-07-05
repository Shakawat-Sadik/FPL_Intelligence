/*
Next.js app adapter
*/
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/server/trpc/root";
import { appRouter } from "@/server/trpc/router"; // We will create this next

// We haven't created the router yet, so comment this out for 10 seconds
export const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter, 
    createContext: createTRPCContext,
  });
}

export { handler as GET, handler as POST };