import { z } from "zod";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { AmountStrSchema, BalanceAssetIdSchema } from "@domain/entity-account-balance";

/** The periods of the balance graph, as the portfolio offers them. */
export const BALANCE_HISTORY_RANGES = ["day", "week", "month", "year", "all"] as const;

export const BalanceHistoryRangeSchema = z.enum(BALANCE_HISTORY_RANGES);

/** What a source answers when a read names no range. */
export const DEFAULT_BALANCE_HISTORY_RANGE = BalanceHistoryRangeSchema.enum.month;

/** The balance of one asset at one date, in the asset's smallest unit. */
export const BalancePointSchema = z.object({
  date: DateTimeIsoSchema,
  balance: AmountStrSchema,
});

/** The balance of one asset over the range, oldest point first; the last point is the current balance. */
export const AssetBalanceHistorySchema = z.object({
  assetId: BalanceAssetIdSchema,
  points: z.array(BalancePointSchema),
});

/** One series per asset of the account, the native coin first. */
export const AccountBalanceHistorySchema = z.object({
  range: BalanceHistoryRangeSchema,
  series: z.array(AssetBalanceHistorySchema),
});

export type BalanceHistoryRange = z.infer<typeof BalanceHistoryRangeSchema>;
export type BalancePoint = z.infer<typeof BalancePointSchema>;
export type AssetBalanceHistory = z.infer<typeof AssetBalanceHistorySchema>;
export type AccountBalanceHistory = z.infer<typeof AccountBalanceHistorySchema>;

export type AccountBalanceHistoryQuery = {
  range: BalanceHistoryRange;
};

/** The series of each account, by the range they were read for. */
export const AccountBalanceHistoriesStateSchema = z.partialRecord(
  AccountUUIDSchema,
  z.partialRecord(BalanceHistoryRangeSchema, z.array(AssetBalanceHistorySchema)),
);

export type AccountBalanceHistoriesState = z.infer<typeof AccountBalanceHistoriesStateSchema>;

export const initialAccountBalanceHistoriesState: AccountBalanceHistoriesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** The result names its range, which the slice keys the series by. */
    balanceHistory: {
      query: AccountBalanceHistoryQuery | undefined;
      result: AccountBalanceHistory;
    };
  }
}
