// src/server/trpc/router.ts
import { createTRPCRouter } from "./root";

export const appRouter = createTRPCRouter({
  // We will put our playerRouter, userRouter etc. inside here later
});

export type AppRouter = typeof appRouter;