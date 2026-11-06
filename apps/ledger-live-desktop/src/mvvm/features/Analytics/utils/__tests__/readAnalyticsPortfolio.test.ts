import { readAnalyticsBalance, type AnalyticsQueryContext } from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { createReadAnalyticsPortfolio } from "../readAnalyticsPortfolio";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-balance-eth");
const token = createAnalyticsToken(eth);
const btc = createAnalyticsAccount("analytics-balance-btc", "bitcoin");
const positions: AccountLike[] = [eth, token, btc];
const countervalues = createAnalyticsCountervalues(positions);
const context: AnalyticsQueryContext = {
  assetId: "ethereum",
  accountId: eth.id,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id],
  period: "1m",
  metric: "balance",
};

function readBalance(scope: AnalyticsQueryContext, rates = countervalues) {
  return readAnalyticsBalance(scope, {
    positions,
    countervalues: rates,
    fiat: analyticsFiat,
    readPortfolio: createReadAnalyticsPortfolio(rates, analyticsFiat),
  });
}

describe("createReadAnalyticsPortfolio", () => {
  it.each(["1d", "1m", "all"] as const)("should build a native balance series for %s", period => {
    const result = readBalance({ ...context, period });
    if (result.status !== "ready") throw new Error("Expected a ready balance");
    expect(result.data.history.length).toBeGreaterThan(0);
    expect(result.data.history.every(point => Number.isFinite(point.amount))).toBe(true);
    expect(result.data.amount).toBeGreaterThan(0);
    expect(result.data.amount).toBe(result.data.history.at(-1)?.amount);
    expect(Number.isFinite(result.data.variation.amount)).toBe(true);
  });

  it("should chart the priced positions only when a held position has no price", () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    const scope = { ...context, assetId: null, accountId: null, positionIds: [eth.id, btc.id] };
    const result = readBalance(scope, btcOnly);
    const btcResult = readBalance({ ...scope, positionIds: [btc.id] }, btcOnly);
    if (result.status !== "ready" || btcResult.status !== "ready")
      throw new Error("Expected a ready balance");
    expect(result.data.amount).toBeGreaterThan(0);
    expect(result.data.amount).toBe(btcResult.data.amount);
  });

  it("should report the positions that have a balance history", () => {
    const snapshot = createReadAnalyticsPortfolio(countervalues, analyticsFiat)(
      [eth, btc],
      "month",
    );
    expect(snapshot.positionIdsWithHistory).toEqual(expect.arrayContaining([eth.id, btc.id]));
  });
});
