import { getCostBasis, invalidatePnLCache } from "../costBasisCache";
import { EUR, USD } from "../scenarios/currencies";
import { resetOperationIdCounter } from "../scenarios/operations";
import { buildHodlerScenario } from "../scenarios/hodler";
import { buildMultiAssetScenario } from "../scenarios/multiAsset";
import { buildSingleTradeScenario } from "../scenarios/singleTrade";
import { buildTraderScenario } from "../scenarios/trader";
import { expectAssetPnL } from "./helpers/pnl";

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

describe("costBasisCache — memoisation policy (key = accountId | fiat | lastOpId | historyKey)", () => {
  it("identical inputs return the same CostBasisState reference (cache hit)", () => {
    const scenario = buildHodlerScenario();
    const a = getCostBasis(scenario.account, USD, scenario.countervalues);
    const b = getCostBasis(scenario.account, USD, scenario.countervalues);
    expect(a).toBe(b);
  });

  describe("invalidatePnLCache", () => {
    it("scoped to an accountId: drops only that account's entries", () => {
      const scenario = buildMultiAssetScenario();
      const btcBefore = getCostBasis(scenario.btcAccount, USD, scenario.countervalues);
      const ethBefore = getCostBasis(scenario.ethAccount, USD, scenario.countervalues);

      invalidatePnLCache(scenario.btcAccount.id);

      const btcAfter = getCostBasis(scenario.btcAccount, USD, scenario.countervalues);
      const ethAfter = getCostBasis(scenario.ethAccount, USD, scenario.countervalues);

      expect(btcAfter).not.toBe(btcBefore);
      expect(ethAfter).toBe(ethBefore);
    });

    it("no argument: full reset (every entry dropped)", () => {
      const scenario = buildMultiAssetScenario();
      const before = getCostBasis(scenario.btcAccount, USD, scenario.countervalues);
      invalidatePnLCache();
      const after = getCostBasis(scenario.btcAccount, USD, scenario.countervalues);
      expect(after).not.toBe(before);
    });
  });

  describe("fiat is part of the cache key (USD and EUR do not collide)", () => {
    it("USD and EUR yield distinct CostBasisState references for the same account", () => {
      const scenario = buildSingleTradeScenario();
      const inEur = getCostBasis(scenario.heldAccount, EUR, scenario.countervalues);

      const usdHistoryOnly = (() => {
        const { data, status, cache } = scenario.countervalues;
        return {
          data: { ...data, "BTC USD": data["BTC EUR"] },
          status: { ...status, "BTC USD": status["BTC EUR"] },
          cache: { ...cache, "BTC USD": cache["BTC EUR"] },
        };
      })();
      const inUsd = getCostBasis(scenario.heldAccount, USD, usdHistoryOnly);

      expect(inUsd).not.toBe(inEur);
    });
  });

  describe("isSpamOperation bypasses the cache", () => {
    it("filtered call returns a different costBasis from the cached unfiltered baseline (no stale read)", () => {
      const scenario = buildTraderScenario();

      // Cache test: we want to observe the raw reducer output bypassing the
      // cache. Reconciliation is balance-driven (uncached) and would mask the
      // difference here, so disable it for both calls.
      const baseline = expectAssetPnL(scenario.account, scenario.countervalues, USD, {
        reconcileWithBalance: false,
      });
      const filtered = expectAssetPnL(scenario.account, scenario.countervalues, USD, {
        isSpamOperation: scenario.dustPredicate,
        reconcileWithBalance: false,
      });

      expect(filtered.costBasis.eq(baseline.costBasis)).toBe(false);
      expect(filtered.costBasis.lt(baseline.costBasis)).toBe(true);
    });

    it("filtered call leaves the cache untouched: subsequent unfiltered call still hits", () => {
      const scenario = buildHodlerScenario();

      const before = getCostBasis(scenario.account, USD, scenario.countervalues);
      getCostBasis(scenario.account, USD, scenario.countervalues, {
        isSpamOperation: () => true,
      });
      const after = getCostBasis(scenario.account, USD, scenario.countervalues);

      expect(after).toBe(before);
    });
  });
});
