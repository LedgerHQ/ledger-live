import { z } from "zod";

/** Minimal account identity exchanged over wallet sync. Rehydrated by descriptorToAccount(). */
export const accountDescriptorSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  index: z.number(),
});

export type AccountDescriptor = z.infer<typeof accountDescriptorSchema>;

export type NonImportedAccountInfo = {
  id: string;
  attempts: number;
  attemptsLastTimestamp: number;
  error?: {
    name: string;
    message: string;
  };
};

/** Tracks accounts present in cloud sync but not yet imported locally. */
export type NonImportedAccountsState = NonImportedAccountInfo[];

export const initialNonImportedAccountsState: NonImportedAccountsState = [];
