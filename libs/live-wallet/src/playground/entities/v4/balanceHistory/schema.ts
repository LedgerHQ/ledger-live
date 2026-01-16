import { z } from "zod";

export const GranularityIdSchema = z.enum(["HOUR", "DAY", "WEEK"]);

export const BalanceHistoryDataCacheSchema = z.object({
  latestDate: z.number().nullable().optional(),
  balances: z.array(z.number()),
});

export const BalanceHistoryCacheSchema = z.record(
  GranularityIdSchema,
  BalanceHistoryDataCacheSchema,
);

export const BalanceHistoryByAccountSchema = z.record(z.string(), BalanceHistoryCacheSchema);
