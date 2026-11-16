import { z } from "zod";
import { AmountStrSchema } from "@domain/entity-account-balance";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";

/** The provider's id of a swap. */
export const SwapIdSchema = z.string().min(1).brand<"SwapId">();

export type SwapId = z.infer<typeof SwapIdSchema>;

/** A non-negative decimal, e.g. "1.5". */
const DecimalStrSchema = z.string().regex(/^\d+(\.\d+)?$/, "Expected a non-negative decimal");

/** One swap the app made, as recorded after it was broadcast. */
export const SwapHistoryEntrySchema = z.object({
  swapId: SwapIdSchema,
  provider: z.string().min(1),
  /** The provider's status, e.g. "pending", "finished", "refunded". */
  status: z.string(),
  /** The account the swap is recorded on, which holds `operationId`: the sender, unless `fromAccountUUID` is set. */
  accountUUID: AccountUUIDSchema,
  /** The asset of `accountUUID` the swap moved: its native coin or one of its tokens. */
  assetId: CryptoOrTokenCurrencyIdSchema,
  /** The sender, when it has no operation to record the swap on (perps withdraw). */
  fromAccountUUID: AccountUUIDSchema.optional(),
  fromAssetId: CryptoOrTokenCurrencyIdSchema.optional(),
  /** Absent when the receiving account is not in the accounts list. */
  toAccountUUID: AccountUUIDSchema.optional(),
  toAssetId: CryptoOrTokenCurrencyIdSchema.optional(),
  /** The operation the swap is anchored to; absent until known (a withdraw before its payout tx). */
  operationId: z.string().min(1).optional(),
  /** In the sender asset's smallest unit. */
  fromAmount: AmountStrSchema,
  /** The quoted amount, in the receiving asset's smallest unit. */
  toAmount: AmountStrSchema,
  /** The amount received as a centralized provider reports it, in the receiving asset's main unit. */
  finalAmount: DecimalStrSchema.optional(),
  /** Fees the anchoring operation does not carry, in the sender asset's smallest unit. */
  feesAmount: AmountStrSchema.optional(),
  /** Payout fees, in the receiving asset's smallest unit. */
  payoutFeesAmount: AmountStrSchema.optional(),
  /** When the swap was submitted, in ms, when no operation dates it yet. */
  createdAt: z.number().int().nonnegative().optional(),
});

export type SwapHistoryEntry = z.infer<typeof SwapHistoryEntrySchema>;

/** The swaps of each account, keyed by the account they are recorded on. */
export const SwapHistoryStateSchema = z.partialRecord(
  AccountUUIDSchema,
  z.array(SwapHistoryEntrySchema),
);

export type SwapHistoryState = z.infer<typeof SwapHistoryStateSchema>;

export const initialSwapHistoryState: SwapHistoryState = {};
