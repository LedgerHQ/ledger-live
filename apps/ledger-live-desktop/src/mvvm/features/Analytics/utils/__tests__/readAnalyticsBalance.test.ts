import { readAnalyticsBalance } from "../readAnalyticsBalance";
import {
  analyticsFiat,
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-balance-eth");
const token = createAnalyticsToken(eth);
const btc = createAnalyticsAccount("analytics-balance-btc", "bitcoin");
const positions = [eth, token, btc];
const countervalues = createAnalyticsCountervalues(positions);
const context = {
  assetId: "ethereum",
  accountId: eth.id,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id],
  period: "1m" as const,
  metric: "balance" as const,
};

describe("readAnalyticsBalance", () => {
  it.each(["1d", "1m", "all"] as const)("should build a native balance series for %s", period => {
    const result = readAnalyticsBalance(
      { ...context, period },
      positions,
      countervalues,
      analyticsFiat,
    );
    if (result.status !== "ready") throw new Error("Expected a ready balance");
    expect(result.data.history.length).toBeGreaterThan(0);
    expect(result.data.history.every(point => Number.isFinite(point.amount))).toBe(true);
    expect(result.data.amount).toBeGreaterThan(0);
    expect(result.data.amount).toBe(result.data.history.at(-1)?.amount);
  });

  it("should report unavailable instead of a partial sum when a held position has no price", () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    const scope = { ...context, assetId: null, accountId: null, positionIds: [eth.id, btc.id] };
    expect(readAnalyticsBalance(scope, positions, btcOnly, analyticsFiat).status).toBe(
      "unavailable",
    );
  });

  it("should report unavailable for a removed position", () => {
    expect(
      readAnalyticsBalance(
        { ...context, positionIds: ["removed"] },
        positions,
        countervalues,
        analyticsFiat,
      ).status,
    ).toBe("unavailable");
  });

  it("should reject an unsupported metric", () => {
    expect(
      readAnalyticsBalance(
        { ...context, metric: "total-return" },
        positions,
        countervalues,
        analyticsFiat,
      ).status,
    ).toBe("unavailable");
  });
});
