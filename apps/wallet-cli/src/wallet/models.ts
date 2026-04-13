// Models for the CLI wallet layer.
// All types are serializable (no BigNumber, no Date, no circular refs).
// NB: these will progressively move to /shared and /domain as the architecture rework lands.

import { z } from "zod";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { OperationType } from "@ledgerhq/types-live";
import { parseV1, toV0 } from "../shared/accountDescriptor";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";

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

/**
 * Bundled result of account discovery: the V1 descriptor and the fresh receive address.
 * V1 does not store freshAddress (it is dynamic); it is carried separately here.
 */
export type DiscoveredAccount = {
  descriptor: AccountDescriptorV1;
  freshAddress: string;
};

// Short form: "{id}:{index}" — e.g. "js:2:bitcoin:xpub...:native_segwit:0"
// id already encodes currencyId, xpub (= seedIdentifier) and derivationMode via decodeAccountId.
export function parseShortAccountDescriptor(short: string): AccountDescriptor {
  const lastColon = short.lastIndexOf(":");
  if (lastColon < 0) {
    throw new Error(`Invalid short account descriptor: "${short}"`);
  }
  const index = Number.parseInt(short.slice(lastColon + 1), 10);
  if (Number.isNaN(index)) {
    throw new TypeError(`Invalid short account descriptor: "${short}"`);
  }
  const id = short.slice(0, lastColon);
  const { currencyId, xpubOrAddress: seedIdentifier, derivationMode } = decodeAccountId(id);
  return { id, currencyId, freshAddress: "", seedIdentifier, derivationMode, index };
}

/**
 * Parse an account descriptor from either V1 format ("account:1:...") or the legacy V0 short
 * format ("js:2:bitcoin:xpub...:native_segwit:0"). Returns a V0 AccountDescriptor suitable
 * for the bridge layer.
 */
export function parseAccountDescriptor(input: string): AccountDescriptor {
  if (input.startsWith("account:1:")) {
    return toV0(parseV1(input));
  }
  return parseShortAccountDescriptor(input);
}

export function resolveAccountArg(
  account: string | undefined,
  positional: readonly string[],
): string {
  const arg = account ?? positional[0];
  if (!arg) {
    throw new Error(
      "Missing account: use --account <descriptor> or pass it as the first positional argument.",
    );
  }
  return arg;
}

export const CurrencyIdSchema = z.string().min(1);
export type CurrencyId = z.infer<typeof CurrencyIdSchema>;

export const OutputFormatSchema = z.enum(["human", "json"]);

export const AccountIdSchema = z.string(); // AccountId: branded type pending

export const BalanceSchema = z.object({
  assetId: z.string(),
  balance: BigNumberStrSchema,
});
export type Balance = z.infer<typeof BalanceSchema>;

export const OperationTypeSchema = z.string() as z.ZodType<OperationType>; // Typed against the exhaustive live union; runtime bridging ensures validity.

// Flat, fully serializable operation.
// No subOperations / internalOperations recursion — those are flattened at the compatibility layer.
export type SendEvent =
  | { type: "prepared"; recipient: string; amount: string; fees: string }
  | { type: "device-streaming"; progress: number; index: number; total: number }
  | { type: "device-signature-requested" }
  | { type: "device-signature-granted" }
  | { type: "dry-run" }
  | { type: "broadcasted"; txHash: string };

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
  // assetId: currency or token ID used to format value/fee amounts.
  // For native ops this is the currencyId (e.g. "ethereum"); for token ops it is the token id
  // (e.g. "ethereum/erc20/usd~!underscore!~tether"). Stored explicitly to avoid decoding
  // accountId, which may be a TokenAccount id and cannot be parsed by decodeAccountId.
  assetId: z.string(),
  date: DateTimeIsoSchema,
  /** Set on internal operations (e.g. ETH contract calls): the id of the parent operation. */
  parentId: z.string().optional(),
});
export type Operation = z.infer<typeof OperationSchema>;
