// src/server/trpc/router.ts
import { insertUserSchema, users } from "@/server/db/schema";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "../root";

export const userRouter = createTRPCRouter({
  // We will put our playerRouter, userRouter etc. inside here later
  createUser: publicProcedure
    .input(insertUserSchema.pick({ email: true, name: true }))
    .mutation(async ({ input }) => {
      const [newUser] = await db
        .insert(users)
        .values({ email: input.email, name: input.name })
        .returning();

      return newUser;
    }),
});

export type UserRouterType = typeof userRouter;