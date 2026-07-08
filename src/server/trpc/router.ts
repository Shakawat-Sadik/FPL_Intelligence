// src/server/trpc/router.ts
import { createTRPCRouter } from "./root";
import { userRouter } from "./routers/users";

export const appRouter = createTRPCRouter({
  user: userRouter,
//   player: playerRouter,
});

export type AppRouter = typeof appRouter;