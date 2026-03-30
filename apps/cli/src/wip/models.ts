// Models for the CLI wallet layer.
// All types are serializable (no BigNumber, no Date, no circular refs).
// NB: these will progressively move to /shared and /domain as the architecture rework lands.

import { z } from "zod";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { OperationType } from "@ledgerhq/types-live";

// this type is taken from WalletSync, should eventually land in /domain as well
export const accountDescriptorSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  index: z.number(),
});

export type AccountDescriptor = z.infer<typeof accountDescriptorSchema>;

export const AccountIdSchema = z.string(); // TODO shall have its branded type

export const BalanceSchema = z.object({
  assetId: z.string(),
  balance: BigNumberStrSchema,
});
export type Balance = z.infer<typeof BalanceSchema>;

export const OperationTypeSchema = z.string() as z.ZodType<OperationType>; // Typed against the exhaustive live union; runtime bridging ensures validity.

// Flat, fully serializable operation.
// No subOperations / internalOperations recursion — those are flattened at the compatibility layer.
export const OperationSchema = z.object({
  id: z.string(),
  hash: z.string(),
  type: OperationTypeSchema,
  value: BigNumberStrSchema,
  fee: BigNumberStrSchema,
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  blockHeight: z.number().nullable(),
  accountId: AccountIdSchema,
  date: DateTimeIsoSchema,
});
export type Operation = z.infer<typeof OperationSchema>;
