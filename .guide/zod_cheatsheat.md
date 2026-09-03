# Zod Cheat Sheet

## 1. Basics

| What you want to do in plain English | The Zod TypeScript Code                        | What it does                              |
| :----------------------------------- | :--------------------------------------------- | :----------------------------------------- |
| **Define a string field**            | `z.string()`                                   | Value must be a string                    |
| **Define a number field**            | `z.number()`                                   | Value must be a number                    |
| **Make a field required**            | `z.string()` (required by default)             | Errors if missing/undefined               |
| **Make a field optional**            | `z.string().optional()`                        | Allows `undefined`                        |
| **Validate an object shape**         | `z.object({ email: z.string() })`              | Validates `{ email: string }`             |
| **Parse and throw on failure**       | `schema.parse(data)`                           | Throws `ZodError` if invalid              |
| **Parse without throwing**           | `schema.safeParse(data)`                       | Returns `{ success, data/error }`          |
| **Infer the TS type from a schema**  | `type User = z.infer<typeof userSchema>`       | Generates a TypeScript type automatically |

```ts
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

type User = z.infer<typeof userSchema>;
```

---

## 2. Primitive types

| Plain English                | Zod code                          |
| :------------------------------ | :---------------------------------- |
| String                         | `z.string()`                       |
| Number                         | `z.number()`                       |
| BigInt                         | `z.bigint()`                       |
| Boolean                        | `z.boolean()`                      |
| Date                           | `z.date()`                         |
| Undefined                      | `z.undefined()`                    |
| Null                            | `z.null()`                         |
| Any value (skip validation)    | `z.any()`                          |
| Unknown (safer than `any`)      | `z.unknown()`                      |
| Never (should not occur)       | `z.never()`                        |
| Void (function returns nothing)| `z.void()`                         |
| A specific literal value        | `z.literal("admin")`               |
| One of several allowed strings  | `z.enum(["admin", "user", "guest"])` |

---

## 3. String validators

| Plain English                     | Zod code                                   |
| :----------------------------------- | :--------------------------------------------|
| Must be a valid email                | `z.string().email()`                       |
| Must be a valid URL                  | `z.string().url()`                         |
| Must be a valid UUID                 | `z.string().uuid()`                        |
| Minimum length                       | `z.string().min(3)`                        |
| Maximum length                       | `z.string().max(255)`                      |
| Exact length                         | `z.string().length(6)`                     |
| Must match a regex                   | `z.string().regex(/^[a-z]+$/)`             |
| Must start with a prefix             | `z.string().startsWith("sk_")`             |
| Must end with a suffix               | `z.string().endsWith(".com")`              |
| Must contain a substring              | `z.string().includes("@")`                 |
| Trim whitespace before validating     | `z.string().trim()`                        |
| Convert to lowercase after validating | `z.string().toLowerCase()`                 |
| Non-empty string                     | `z.string().min(1)`                        |
| Custom error message                 | `z.string().min(3, { message: "Too short" })` |

---

## 4. Number validators

| Plain English            | Zod code                    |
| :--------------------------| :------------------------------|
| Must be an integer          | `z.number().int()`            |
| Minimum value                | `z.number().min(0)`            |
| Maximum value                | `z.number().max(100)`          |
| Must be positive             | `z.number().positive()`        |
| Must be negative             | `z.number().negative()`        |
| Must be non-negative (≥0)   | `z.number().nonnegative()`     |
| Must be a multiple of a value | `z.number().multipleOf(5)`   |
| Coerce a string into a number | `z.coerce.number()`          |

---

## 5. Object schemas

| Plain English                          | Zod code                                                         |
| :---------------------------------------- | :-------------------------------------------------------------- |
| Define an object shape                    | `z.object({ id: z.string(), age: z.number() })`                 |
| Pick specific keys                        | `schema.pick({ email: true })`                                  |
| Omit specific keys                        | `schema.omit({ password: true })`                                |
| Make all fields optional                  | `schema.partial()`                                               |
| Make all fields required                  | `schema.required()`                                              |
| Merge two schemas                         | `schemaA.merge(schemaB)`                                         |
| Extend a schema with new fields           | `schema.extend({ role: z.string() })`                            |
| Disallow extra/unknown keys               | `schema.strict()`                                                |
| Strip unknown keys silently (default)     | `schema.strip()`                                                 |
| Allow and keep unknown keys               | `schema.passthrough()`                                           |
| Deep partial (nested objects too)         | `schema.deepPartial()`                                           |

```ts
const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive(),
});

// Only allow inserting email + name (like drizzle-zod's .pick())
const createUserInput = insertUserSchema.pick({ email: true, name: true });
```

---

## 6. Arrays, tuples, records, unions

| Plain English                            | Zod code                                              |
| :------------------------------------------ | :------------------------------------------------------|
| Array of strings                            | `z.array(z.string())`                                 |
| Array with min/max length                   | `z.array(z.string()).min(1).max(10)`                  |
| Non-empty array                              | `z.array(z.string()).nonempty()`                      |
| Fixed-length tuple                           | `z.tuple([z.string(), z.number()])`                   |
| Object with dynamic keys                     | `z.record(z.string(), z.number())`                    |
| Either A or B (union)                        | `z.union([z.string(), z.number()])`                   |
| Shorthand union                              | `z.string().or(z.number())`                           |
| Discriminated union (fast, tagged)           | `z.discriminatedUnion("type", [schemaA, schemaB])`    |
| Intersection (must satisfy both)             | `z.intersection(schemaA, schemaB)`                    |

---

## 7. Optional, nullable, defaults

| Plain English                              | Zod code                                    |
| :---------------------------------------------| :---------------------------------------------|
| Allow `undefined`                             | `z.string().optional()`                     |
| Allow `null`                                  | `z.string().nullable()`                     |
| Allow both `null` and `undefined`              | `z.string().nullish()`                      |
| Provide a default value if missing            | `z.string().default("guest")`               |
| Catch invalid input and fall back to a value  | `z.string().catch("fallback")`              |

---

## 8. Custom validation & transformation

| Plain English                              | Zod code                                                          |
| :---------------------------------------------| :--------------------------------------------------------------------|
| Custom validation logic                       | `z.string().refine((val) => val.length > 5, "Too short")`          |
| Validate across multiple fields               | `schema.refine((data) => data.password === data.confirm, { message: "Passwords must match", path: ["confirm"] })` |
| Transform the value after validation          | `z.string().transform((val) => val.trim().toLowerCase())`          |
| Chain parse then transform                    | `z.string().email().transform((val) => val.toLowerCase())`         |
| Preprocess input before validating            | `z.preprocess((val) => Number(val), z.number())`                   |

```ts
const signupSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

---

## 9. Parsing & error handling

| Plain English                               | Zod code                                       |
| :----------------------------------------------| :-------------------------------------------------|
| Parse and throw on invalid input               | `schema.parse(input)`                          |
| Parse safely (no throw)                        | `const result = schema.safeParse(input)`        |
| Check success                                  | `if (result.success) { result.data }`           |
| Read validation errors                         | `result.error.issues` (or `.flatten()`)         |
| Async parsing (for async `.refine`)             | `await schema.parseAsync(input)`                |
| Async safe parsing                              | `await schema.safeParseAsync(input)`            |

```ts
const result = userSchema.safeParse(req.body);

if (!result.success) {
  console.error(result.error.flatten());
  throw new Error("Invalid input");
}

const user = result.data; // fully typed
```

---

## 10. Zod + tRPC (this project's actual usage)

tRPC uses a Zod schema in `.input()` to validate incoming request data before your resolver ever runs.

```ts
// src/server/trpc/router.ts
import { createTRPCRouter, publicProcedure } from "./root";
import { insertUserSchema, users } from "@/server/db/schema";
import { db } from "@/server/db";

export const appRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(insertUserSchema.pick({ email: true, name: true }))
    .mutation(async ({ input }) => {
      // input.email and input.name are guaranteed to be valid strings here
      const [newUser] = await db.insert(users).values(input).returning();
      return newUser;
    }),
});
```

---

## 11. Zod + Drizzle (`drizzle-zod`, this project's actual usage)

Instead of hand-writing a Zod schema that duplicates your Drizzle table, generate it directly from the table definition.

| Plain English                                 | Drizzle-Zod code                                |
| :------------------------------------------------| :---------------------------------------------------|
| Generate a schema for inserting a row             | `createInsertSchema(table)`                       |
| Generate a schema for a row as read from the DB   | `createSelectSchema(table)`                        |
| Override/refine one field's validation            | `createInsertSchema(table, { email: (schema) => schema.email() })` |

```ts
// src/server/db/schema.ts
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
```

Change a column in `users` and both `insertUserSchema` and `selectUserSchema` update automatically — zero duplication between your DB layer and your validation layer.
