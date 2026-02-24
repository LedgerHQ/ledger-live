/**
 * BalanceHistory domain – Zod schemas and inferred types.
 */
import { z } from "zod";

const BalanceHistoryCacheSchema = z.any(); // BalanceHistoryCache from types-live

export const BalanceHistoryStateSchema = z.object({
  byAccountId: z.record(BalanceHistoryCacheSchema),
});

export type BalanceHistoryState = z.infer<typeof BalanceHistoryStateSchema>;
