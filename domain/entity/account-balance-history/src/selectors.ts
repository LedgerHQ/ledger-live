import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
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
): AssetBalanceHistory[] | undefined => state.accountBalanceHistories[accountUUID]?.[range]?.series;

export const selectAccountAssetBalanceHistory = (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
  assetId: CryptoOrTokenCurrencyId,
): AssetBalanceHistory | undefined =>
  state.accountBalanceHistories[accountUUID]?.[range]?.series.find(
    series => series.assetId === assetId,
  );
