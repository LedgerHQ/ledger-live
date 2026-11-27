import { z } from "zod";

export const AccountUUIDSchema = z.uuid({ version: "v5" }).brand<"AccountUUID">();

/** Deterministic identity of an account, the same on every device; carries no account key. */
export type AccountUUID = z.infer<typeof AccountUUIDSchema>;
