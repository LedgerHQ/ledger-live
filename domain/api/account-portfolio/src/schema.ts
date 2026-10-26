import { z } from "zod";

/** Fields this package reads. A response may carry more; those stay on the payload, unchecked. */

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

export const PortfolioRegistrationEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  address: z.string().optional(),
  network: z.string().optional(),
  xpub: z.string().optional(),
});

export const PortfolioSchema = z.object({
  id: z.string(),
  registrations: z.array(PortfolioRegistrationEntrySchema).optional(),
  accounts: z.array(PortfolioAccountSchema).optional(),
});

export const AssetChangeSchema = z.object({
  asset: z.string(),
  cal_id: z.string().nullish(),
  name: z.string().nullish(),
  ticker: z.string().nullish(),
  decimals: z.number().int().nullish(),
  amount: z.string(),
  currency_value: z.number().nullish(),
});

export const UpdateViewSchema = z.object({
  network: z.string(),
  account_id: z.string(),
  time: z.string(),
  block: z.unknown().nullish(),
  tx: z.object({ hash: z.string() }),
  failed: z.boolean(),
  deltas: z.array(AssetChangeSchema).optional(),
  fee: AssetChangeSchema,
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
});

const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextToken: z.string().nullish() });

export const UpdatesPageSchema = pageOf(UpdateViewSchema);

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
