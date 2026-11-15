import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { FiatCurrencyTickerSchema, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import {
  initialAccountBalanceHistoriesState,
  type AssetBalanceHistory,
  type BalanceHistoryEntry,
  type BalancePoint,
  type BalancePointCountervalues,
  type CountervalueRevisions,
} from "./schema";

type Answer = {
  series: AssetBalanceHistory[];
  revisionOf: (
    assetId: AssetBalanceHistory["assetId"],
    date: BalancePoint["date"],
    ticker: FiatCurrencyTicker,
  ) => number;
};

const tickersOf = (record: object): FiatCurrencyTicker[] =>
  Object.keys(record).flatMap(key => {
    const parsed = FiatCurrencyTickerSchema.safeParse(key);
    return parsed.success ? [parsed.data] : [];
  });

const hasCountervalues = (series: AssetBalanceHistory[]) =>
  series.some(({ points }) => points.some(point => point.countervalues !== undefined));

/** `base`'s series, each point taking `other`'s countervalues at its date while its balance is the same; per fiat, the value from the later answer wins. */
function merge(
  base: Answer,
  other: Answer,
): { series: AssetBalanceHistory[]; revisions: CountervalueRevisions } {
  const otherPoints = new Map(
    other.series.map(each => [
      each.assetId,
      new Map(each.points.map(point => [point.date, point])),
    ]),
  );
  const revisions: CountervalueRevisions = {};
  const series = base.series.map(({ assetId, points }) => ({
    assetId,
    points: points.map(({ countervalues, ...point }): BalancePoint => {
      const same = otherPoints.get(assetId)?.get(point.date);
      const theirs = same?.balance === point.balance ? same.countervalues : undefined;
      const merged: BalancePointCountervalues = {};
      const pointRevisions: Partial<Record<FiatCurrencyTicker, number>> = {};
      for (const ticker of new Set([
        ...tickersOf(countervalues ?? {}),
        ...tickersOf(theirs ?? {}),
      ])) {
        const own = countervalues?.[ticker];
        const their = theirs?.[ticker];
        const ownAt = own === undefined ? -Infinity : base.revisionOf(assetId, point.date, ticker);
        const theirAt =
          their === undefined ? -Infinity : other.revisionOf(assetId, point.date, ticker);
        const value = theirAt > ownAt ? their : own;
        if (value === undefined) continue;
        merged[ticker] = value;
        pointRevisions[ticker] = Math.max(ownAt, theirAt);
      }
      if (Object.keys(merged).length === 0) return point;
      const byDate = (revisions[assetId] ??= {});
      byDate[point.date] = pointRevisions;
      return { ...point, countervalues: merged };
    }),
  }));
  return { series, revisions };
}

export const accountBalanceHistoriesSlice = createSlice({
  name: "accountBalanceHistories",
  initialState: initialAccountBalanceHistoriesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balanceHistory"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      // Two queries may answer one range (no range reads the default one): the newer answer gives the series, and each point's value in a fiat comes from the latest answer that had it.
      const stored = state[accountUUID]?.[data.range];
      const isOlder = stored !== undefined && stored.revision > revision;
      const incomingValued = hasCountervalues(data.series);
      if (isOlder && !incomingValued) return;
      const incoming: Answer = { series: data.series, revisionOf: () => revision };
      const kept: Answer = {
        series: stored?.series ?? [],
        revisionOf: (assetId, date, ticker) =>
          stored?.countervalueRevisions?.[assetId]?.[date]?.[ticker] ??
          stored?.revision ??
          -Infinity,
      };
      let entry: BalanceHistoryEntry;
      if (!incomingValued && !hasCountervalues(stored?.series ?? [])) {
        entry = { revision, series: data.series };
      } else {
        const [base, other] = isOlder ? [kept, incoming] : [incoming, kept];
        const { series, revisions } = merge(base, other);
        const entryRevision = isOlder ? stored.revision : revision;
        entry =
          Object.keys(revisions).length > 0
            ? { revision: entryRevision, series, countervalueRevisions: revisions }
            : { revision: entryRevision, series };
      }
      state[accountUUID] = { ...state[accountUUID], [data.range]: entry };
    });
  },
});

export default accountBalanceHistoriesSlice.reducer;
