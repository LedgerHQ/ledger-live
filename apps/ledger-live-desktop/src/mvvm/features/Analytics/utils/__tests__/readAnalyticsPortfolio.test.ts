import {
  useAnalyticsBalancePort,
  type AnalyticsQueryContext,
} from "@features/flow-account-analytics";
import type { CounterValuesState } from "@domain/entity-market-countervalues";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook } from "tests/testSetup";
import { readAnalyticsPortfolio } from "../readAnalyticsPortfolio";
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
const context = {
  assetId: "ethereum",
  accountId: eth.id,
  fiatCurrencyId: analyticsFiat.ticker,
  positionIds: [eth.id],
  period: "1m" as const,
  metric: "balance" as const,
};

function readAnalyticsBalance(
  scope: AnalyticsQueryContext,
  list: readonly AccountLike[],
  rates: CounterValuesState,
  fiat: typeof analyticsFiat,
) {
  const { result } = renderHook(() =>
    useAnalyticsBalancePort({
      positions: list,
      countervalues: rates,
      fiat,
      readPortfolio: readAnalyticsPortfolio,
    }),
  );
  return result.current.loadBalance(scope, { signal: new AbortController().signal });
}

describe("the balance port with the desktop portfolio read", () => {
  it.each(["1d", "1m", "all"] as const)(
    "should build a native balance series for %s",
    async period => {
      const result = await readAnalyticsBalance(
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
    },
  );

  it("should leave out a held position without a price and chart the priced ones", async () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    const scope = { ...context, assetId: null, accountId: null, positionIds: [eth.id, btc.id] };
    const result = await readAnalyticsBalance(scope, positions, btcOnly, analyticsFiat);
    const btcResult = await readAnalyticsBalance(
      { ...scope, positionIds: [btc.id] },
      positions,
      btcOnly,
      analyticsFiat,
    );
    if (result.status !== "ready" || btcResult.status !== "ready")
      throw new Error("Expected a ready balance");
    expect(result.data.history.length).toBeGreaterThan(0);
    expect(result.data.amount).toBeGreaterThan(0);
    expect(result.data.amount).toBe(btcResult.data.amount);
  });

  it("should report unavailable when every held position lacks a price", async () => {
    const btcOnly = createAnalyticsCountervalues([btc]);
    expect((await readAnalyticsBalance(context, positions, btcOnly, analyticsFiat)).status).toBe(
      "unavailable",
    );
  });

  it("should report unavailable for a removed position", async () => {
    expect(
      (
        await readAnalyticsBalance(
          { ...context, positionIds: ["removed"] },
          positions,
          countervalues,
          analyticsFiat,
        )
      ).status,
    ).toBe("unavailable");
  });

  it("should reject an unsupported metric", async () => {
    expect(
      (
        await readAnalyticsBalance(
          { ...context, metric: "total-return" },
          positions,
          countervalues,
          analyticsFiat,
        )
      ).status,
    ).toBe("unavailable");
  });
});
