import { z } from "zod";

/**
 * Wire schemas for the Portfolio service (OpenAPI 0.3.0-rc.4). Chain-specific A4 data
 * (`events`, `tx.details`, `event_data`) is passed through as `unknown`.
 */

export const PortfolioAccountStatusSchema = z.enum([
  "not_registered",
  "registration_failure",
  "synchronized",
  "uninitialized",
]);

export const PortfolioAccountSchema = z.object({
  id: z.string(),
  network: z.string(),
  status: PortfolioAccountStatusSchema,
});

/**
 * What the service keeps of a registration: the id to remove it by, its type, and the fields it
 * was registered with (`address`, or `network`, `xpub` and `derivationPath`).
 */
export const PortfolioRegistrationEntrySchema = z.looseObject({
  id: z.string(),
  type: z.string(),
});

export const PortfolioSchema = z.object({
  id: z.string(),
  registrations: z.array(PortfolioRegistrationEntrySchema).optional(),
  accounts: z.array(PortfolioAccountSchema).optional(),
});

/** Metadata + value shared by every amount the service enriches with CAL and CVS data. */
const CalAmountShape = {
  asset: z.string(),
  cal_id: z.string().nullish(),
  name: z.string().nullish(),
  ticker: z.string().nullish(),
  decimals: z.number().int().nullish(),
  amount: z.string(),
  currency_value: z.number().nullish(),
};

export const AssetChangeSchema = z.object(CalAmountShape);

export const OperationFeeSchema = z.object({
  ...CalAmountShape,
  payer: z.string().nullish(),
});

export const OperationPartSchema = z.union([
  z.object({
    type: z.literal("transfer"),
    address: z.string(),
    peer: z.string().nullish(),
    ...CalAmountShape,
  }),
  z.object({ type: z.literal("fee"), address: z.string(), asset: z.string(), amount: z.string() }),
  z.object({
    type: z.literal("event"),
    address: z.string(),
    event_path: z.string(),
    event_data: z.unknown(),
  }),
]);

export const UpdateViewSchema = z.object({
  network: z.string(),
  account_id: z.string(),
  time: z.string(),
  block: z.object({ hash: z.string(), height: z.number(), time: z.string() }).nullish(),
  tx: z.object({
    hash: z.string(),
    index: z.number().int().nullish(),
    details: z.unknown().optional(),
  }),
  failed: z.boolean(),
  addresses: z.array(z.string()).optional(),
  senders: z.array(z.string()).optional(),
  recipients: z.array(z.string()).optional(),
  deltas: z.array(AssetChangeSchema).optional(),
  fee: OperationFeeSchema,
  events: z.record(z.string(), z.unknown()),
  parts: z.array(OperationPartSchema).nullish(),
});

export const BalanceEntrySchema = z.object({
  network: z.string(),
  account_id: z.string(),
  asset: z.string(),
  cal_id: z.string().nullish(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.number().int(),
  amount: z.string(),
  currency_value: z.number().nullish(),
  estimated: z.boolean(),
  status: z.enum(["confirmed", "pending"]),
  locked: z.boolean(),
  stake: z.unknown().optional(),
});

const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextToken: z.string().nullish() });

export const UpdatesPageSchema = pageOf(UpdateViewSchema);
/**
 * `/balance` answers one group per account, not one entry per asset: the entries of an account
 * that was read, or the error of one that could not be.
 */
export const BalanceGroupSchema = z.union([
  z.object({
    type: z.literal("success"),
    network: z.string(),
    account_id: z.string(),
    items: z.array(BalanceEntrySchema),
  }),
  z.object({
    type: z.string(),
    network: z.string(),
    account_id: z.string(),
    error: z.string(),
  }),
]);

export const BalancePageSchema = pageOf(BalanceGroupSchema);

export const BALANCE_RANGES = ["all", "day", "hour", "month", "week", "year"] as const;

export const BalanceHistoryPointSchema = z.object({
  network: z.string(),
  account_id: z.string(),
  asset: z.string(),
  cal_id: z.string().nullish(),
  name: z.string().nullish(),
  ticker: z.string().nullish(),
  decimals: z.number().int().nullish(),
  time: z.string(),
  value: z.string(),
  currency_value: z.number().nullish(),
});

/** Like `/balance`, `/balance/history` answers one group per account. */
export const BalanceHistoryGroupSchema = z.union([
  z.object({
    type: z.literal("success"),
    network: z.string(),
    account_id: z.string(),
    items: z.array(BalanceHistoryPointSchema),
  }),
  z.object({
    type: z.string(),
    network: z.string(),
    account_id: z.string(),
    error: z.string(),
  }),
]);

export const BalanceHistoryPageSchema = pageOf(BalanceHistoryGroupSchema);
