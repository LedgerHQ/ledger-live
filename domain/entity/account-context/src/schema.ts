import { z } from "zod";
import { AccountUUIDSchema } from "@domain/entity-account";

/** What an account needs beside its descriptor to be read in full, kept aside because the descriptor is shared and logged. */
export const AccountContextSchema = z.object({
  /** Aleo: reads the account's private records; the device gives it once the user approves. */
  viewKey: z.string().min(1).optional(),
  /** Hedera: the device's public key (hex) at the account's path, which its descriptor, keyed on the account id, cannot give back; a device operation checks the device against it. */
  publicKey: z
    .string()
    .regex(/^[0-9a-f]+$/i)
    .optional(),
});

export type AccountContext = z.infer<typeof AccountContextSchema>;

export const AccountContextStateSchema = z.partialRecord(AccountUUIDSchema, AccountContextSchema);

export type AccountContextState = z.infer<typeof AccountContextStateSchema>;

export const initialAccountContextState: AccountContextState = {};
