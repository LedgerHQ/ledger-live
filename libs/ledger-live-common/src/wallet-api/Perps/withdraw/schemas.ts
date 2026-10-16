import BigNumber from "bignumber.js";
import { z } from "zod";

// TODO(LIVE-39366): placeholder shapes, align with the real SwapKit responses.

// Strings only: JSON numbers are already rounded by JavaScript before BigNumber reads them.
export const DecimalSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Expected a decimal string")
  .transform(value => new BigNumber(value));

// TODO(LIVE-39366): Ledger Wallet or SwapKit currency ids?
export const WithdrawCurrenciesSchema = z.object({
  currencies: z.array(z.looseObject({ id: z.string() })),
});
export type WithdrawCurrencies = z.infer<typeof WithdrawCurrenciesSchema>;

export const WithdrawQuoteSchema = z.object({
  quoteId: z.string().optional(),
  amountTo: DecimalSchema,
  payoutNetworkFees: DecimalSchema,
  expiry: z.number(),
  defaultSlippage: z.number().optional(),
});
export type WithdrawQuote = z.infer<typeof WithdrawQuoteSchema>;

const TypedDataSchema = z.looseObject({
  domain: z.record(z.string(), z.unknown()),
  types: z.record(z.string(), z.array(z.looseObject({ name: z.string(), type: z.string() }))),
  primaryType: z.string(),
  message: z.record(z.string(), z.unknown()),
});
export type WithdrawTypedData = z.infer<typeof TypedDataSchema>;

const MayanPayloadSchema = z.looseObject({
  swapId: z.string().optional(),
  typedData: TypedDataSchema,
});

const NearPayloadSchema = z.looseObject({
  swapId: z.string().optional(),
  hyperCoreAction: z.looseObject({ typedData: TypedDataSchema }),
});

// Loose objects keep unknown fields so the payload is resubmitted unmodified.
export const WithdrawPayloadSchema = z.union([NearPayloadSchema, MayanPayloadSchema]);
export type WithdrawPayload = z.infer<typeof WithdrawPayloadSchema>;

export function getWithdrawTypedData(payload: WithdrawPayload): WithdrawTypedData {
  // The HyperCore action wins: it is what NEAR executes.
  const near = NearPayloadSchema.safeParse(payload);
  if (near.success) return near.data.hyperCoreAction.typedData;
  return MayanPayloadSchema.parse(payload).typedData;
}

export const WithdrawSubmitResultSchema = z.object({
  swapId: z.string(),
});
export type WithdrawSubmitResult = z.infer<typeof WithdrawSubmitResultSchema>;

export const WITHDRAW_STATUSES = [
  "READY",
  "PENDING",
  "UNKNOWN",
  "FINISHED",
  "REFUNDED",
  "EXPIRED",
] as const;

export const WithdrawStatusSchema = z.object({
  swapId: z.string().optional(),
  status: z.enum(WITHDRAW_STATUSES),
  payoutNetworkFees: DecimalSchema.optional(),
  payinTransactionId: z.string().optional(),
  payoutTransactionId: z.string().optional(),
});
export type WithdrawStatus = z.infer<typeof WithdrawStatusSchema>;
