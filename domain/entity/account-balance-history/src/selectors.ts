import type { BalanceAssetId } from "@domain/entity-account-balance";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type {
  AccountBalanceHistoriesState,
  AssetBalanceHistory,
  BalanceHistoryRange,
} from "./schema";

export type WithAccountBalanceHistories = {
  accountBalanceHistories: AccountBalanceHistoriesState;
};

export const selectAccountBalanceHistory = (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
): AssetBalanceHistory[] | undefined => state.accountBalanceHistories[accountUUID]?.[range];

export const selectAccountAssetBalanceHistory = (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
  assetId: BalanceAssetId,
): AssetBalanceHistory | undefined =>
  state.accountBalanceHistories[accountUUID]?.[range]?.find(series => series.assetId === assetId);
