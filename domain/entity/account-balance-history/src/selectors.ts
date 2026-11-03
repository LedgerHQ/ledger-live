import { createSelector } from "@reduxjs/toolkit";
import type { BalanceAssetId, CountervalueTicker } from "@domain/entity-account-balance";
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
  countervalue?: CountervalueTicker,
) => countervalue;

/** The point with the value in `countervalue` only, none without: another read's values do not leak. */
function pointIn(
  { countervalues, ...point }: BalancePoint,
  countervalue?: CountervalueTicker,
): BalancePoint {
  const value = countervalue && countervalues?.[countervalue];
  return value === undefined || countervalue === undefined
    ? point
    : { ...point, countervalues: { [countervalue]: value } };
}

/** Every series read for the range; with `countervalue`, each point carries its value in it when known. */
export const selectAccountBalanceHistory: (
  state: WithAccountBalanceHistories,
  accountUUID: AccountUUID,
  range: BalanceHistoryRange,
  countervalue?: CountervalueTicker,
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
  assetId: BalanceAssetId,
  countervalue?: CountervalueTicker,
): AssetBalanceHistory | undefined =>
  selectAccountBalanceHistory(state, accountUUID, range, countervalue)?.find(
    series => series.assetId === assetId,
  );
