import { initTRPC } from "@trpc/server";
import { db } from "@/db";

export const createTRPCContext = async (opts: { req: Request }) => {
  return {
    db,
    // We will pass the request to BetterAuth here later
    // req: opts.req
  };
};

const engine = initTRPC.context<typeof createTRPCContext>().create();

export const publicProcedure = engine.procedure;
export const createTRPCRouter = engine.router;
