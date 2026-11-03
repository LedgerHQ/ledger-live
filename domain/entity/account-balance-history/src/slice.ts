import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import {
  initialAccountBalanceHistoriesState,
  type AssetBalanceHistory,
  type BalancePoint,
} from "./schema";

/** A point keeps the countervalues of `stored`'s point while its date and balance stay the same, its own winning. */
function withKeptCountervalues(
  series: AssetBalanceHistory[],
  stored: AssetBalanceHistory[] | undefined,
): AssetBalanceHistory[] {
  const storedPoints = new Map(
    (stored ?? []).map(each => [
      each.assetId,
      new Map(each.points.map(point => [point.date, point])),
    ]),
  );
  return series.map(({ assetId, points }) => {
    const previous = storedPoints.get(assetId);
    return {
      assetId,
      points: points.map(({ countervalues, ...point }): BalancePoint => {
        const kept = previous?.get(point.date);
        const merged = {
          ...(kept?.balance === point.balance ? kept.countervalues : undefined),
          ...countervalues,
        };
        return Object.keys(merged).length > 0 ? { ...point, countervalues: merged } : point;
      }),
    };
  });
}

export const accountBalanceHistoriesSlice = createSlice({
  name: "accountBalanceHistories",
  initialState: initialAccountBalanceHistoriesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balanceHistory"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      // Two queries may answer one range (no range reads the default one): the older answer only adds its countervalues.
      const stored = state[accountUUID]?.[data.range];
      const entry =
        stored && stored.revision > revision
          ? { revision: stored.revision, series: withKeptCountervalues(stored.series, data.series) }
          : { revision, series: withKeptCountervalues(data.series, stored?.series) };
      state[accountUUID] = { ...state[accountUUID], [data.range]: entry };
    });
  },
});

export default accountBalanceHistoriesSlice.reducer;
