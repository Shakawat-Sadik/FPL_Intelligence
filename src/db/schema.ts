import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", // pgTable tells Drizzle that this is a PostgreSQL table, and "users" is the name of the table in the database
{
  id: uuid("id").defaultRandom().primaryKey(), 
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/*
uuid("id") = Creates a column named id that stores a UUID (Universally Unique Identifier).
defaultRandom() method generates a random UUID for new records.
primaryKey() method marks the id column as the primary key of the table.

varchar("email", { length: 255 }) = Creates a column named email that stores variable-length strings (text) with a maximum length of 255 characters.
notNull() method ensures that the email column cannot be null (i.e., it must have a value).
unique() method enforces that the values in the email column must be unique across all records in the table.

varchar("name", { length: 255 }) = Creates a column named name that stores variable-length strings (text) with a maximum length of 255 characters.

timestamp("created_at") = Creates a column named created_at that stores timestamp values (date and time).
defaultNow() method sets the default value of the created_at column to the current timestamp when a new record is inserted.
notNull() method ensures that the created_at column cannot be null.
*/