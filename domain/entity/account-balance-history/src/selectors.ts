import { createSelector } from "@reduxjs/toolkit";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type {
  AccountBalanceHistoriesState,
  AssetBalanceHistory,
  BalanceHistoryRange,
  BalancePoint,
} from "./schema";

export type WithAccountBalanceHistories = {
  accountBalanceHistories: AccountBalanceHistoriesState;
};

const selectStoredSeries = (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
) => state.accountBalanceHistories[accountUUID]?.[range]?.series;

const selectCountervalue = (
  _state: WithAccountBalanceHistories,
  _accountUUID: AccountUUID,
  _range: BalanceHistoryRange,
  countervalue?: FiatCurrencyTicker,
) => countervalue;

/** The point with its value in `countervalue` only, none without: the values another read asked for stay out. */
function pointIn(
  { countervalues, ...point }: BalancePoint,
  countervalue: FiatCurrencyTicker | undefined,
): BalancePoint {
  const value = countervalue === undefined ? undefined : countervalues?.[countervalue];
  return countervalue === undefined || value === undefined
    ? point
    : { ...point, countervalues: { [countervalue]: value } };
}

/** Every series read for the range; with `countervalue`, each point carries its value in it when known. */
export const selectAccountBalanceHistory: (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
  countervalue?: FiatCurrencyTicker,
) => AssetBalanceHistory[] | undefined = createSelector(
  [selectStoredSeries, selectCountervalue],
  (series, countervalue) =>
    series?.map(({ assetId, points }) => ({
      assetId,
      points: points.map(point => pointIn(point, countervalue)),
    })),
);

export const selectAccountAssetBalanceHistory = (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
  assetId: CryptoOrTokenCurrencyId,
  countervalue?: FiatCurrencyTicker,
): AssetBalanceHistory | undefined =>
  selectAccountBalanceHistory(state, accountUUID, range, countervalue)?.find(
    series => series.assetId === assetId,
  );
