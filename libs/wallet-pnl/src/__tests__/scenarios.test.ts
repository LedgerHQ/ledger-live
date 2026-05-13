import BigNumber from "bignumber.js";
import { computePortfolioPnL } from "../portfolioPnL";
import { invalidatePnLCache } from "../costBasisCache";
import { pnlPercentage } from "../percentage";
import { EUR, USD } from "../scenarios/currencies";
import { resetOperationIdCounter } from "../scenarios/operations";
import { buildHodlerScenario } from "../scenarios/hodler";
import { buildStakerScenario } from "../scenarios/staker";
import { buildTraderScenario } from "../scenarios/trader";
import { buildMultiAssetScenario, buildNestedSubAccountScenario } from "../scenarios/multiAsset";
import { buildSingleTradeScenario } from "../scenarios/singleTrade";
import { expectBN } from "./helpers/bn";
import { expectAssetPnL } from "./helpers/pnl";

const FIAT_MAJOR_TO_MINOR = new BigNumber(100);

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

describe("computeAssetPnL", () => {
  describe("Hodler — 24 DCA buys + mid-stream partial sell, BTC/USD", () => {
    let scenario: ReturnType<typeof buildHodlerScenario>;
    let pnl: ReturnType<typeof expectAssetPnL>;

    beforeEach(() => {
      scenario = buildHodlerScenario();
      pnl = expectAssetPnL(scenario.account, scenario.countervalues, USD);
    });

    it("final costBasis = running ACB resumed after the mid-stream sell", () => {
      expectBN(pnl.costBasis).toBeCloseToBN(
        scenario.expected.finalCostBasisUsd.times(FIAT_MAJOR_TO_MINOR),
        0,
      );
    });

    it("realisedPnL uses the average entry price at sell date (not the final average)", () => {
      expectBN(pnl.realisedPnL).toBeCloseToBN(
        scenario.expected.realisedPnLUsd.times(FIAT_MAJOR_TO_MINOR),
        0,
      );
      expectBN(pnl.realisedPnL).toBePositive();
    });

    it("unrealisedPnL > 0 when latest price > final ACB", () => {
      expectBN(pnl.unrealisedPnL).toBePositive();
    });

    it("averageEntryPrice > 0", () => {
      expectBN(pnl.averageEntryPrice).toBePositive();
    });

    it("totalPnL = realisedPnL + unrealisedPnL", () => {
      expectBN(pnl.totalPnL).toEqualBN(pnl.realisedPnL.plus(pnl.unrealisedPnL));
    });
  });

  describe("Staker — 1 buy + 12 monthly REWARD inflows, ETH/USD", () => {
    let scenario: ReturnType<typeof buildStakerScenario>;
    let pnl: ReturnType<typeof expectAssetPnL>;

    beforeEach(() => {
      scenario = buildStakerScenario();
      pnl = expectAssetPnL(scenario.account, scenario.countervalues, USD);
    });

    it("each REWARD adds to costBasis at its market price on the reward date", () => {
      expectBN(pnl.costBasis).toBeCloseToBN(
        scenario.expected.totalCostUsd.times(FIAT_MAJOR_TO_MINOR),
        0,
      );
    });

    it("realisedPnL = 0 when no outflow operation exists", () => {
      expectBN(pnl.realisedPnL).toEqualBN(0);
    });

    it("totalPnL = unrealisedPnL when realisedPnL = 0", () => {
      expectBN(pnl.totalPnL).toEqualBN(pnl.unrealisedPnL);
    });

    it("unrealisedPnL > 0 when latest price > average entry price", () => {
      expectBN(pnl.unrealisedPnL).toBePositive();
    });
  });

  describe("Trader — 80 alternating ops with failures and dust", () => {
    let scenario: ReturnType<typeof buildTraderScenario>;

    beforeEach(() => {
      scenario = buildTraderScenario();
    });

    it("fixture loads 80 ops with the documented failed and dust counts", () => {
      expect(scenario.account.operations).toHaveLength(80);
      expect(scenario.account.operations.filter(op => op.hasFailed === true)).toHaveLength(
        scenario.expected.failedCount,
      );
      expect(scenario.account.operations.filter(scenario.dustPredicate)).toHaveLength(
        scenario.expected.dustCount,
      );
    });

    it("unfiltered run yields costBasis > 0", () => {
      const pnl = expectAssetPnL(scenario.account, scenario.countervalues, USD);
      expectBN(pnl.costBasis).toBePositive();
    });

    // The next two assertions probe the cost-basis reducer in isolation
    // (filtering ops should change the cost basis). The trader fixture
    // deliberately makes `balance` disagree with the ops (dust IN ops not
    // reflected on-chain), so the always-on reconciliation layer would
    // otherwise mask the difference. Opt out for these reducer-focused checks.
    it("isSpamOperation excludes matching ops → filtered costBasis < unfiltered baseline", () => {
      const baseline = expectAssetPnL(scenario.account, scenario.countervalues, USD, {
        reconcileWithBalance: false,
      });

      invalidatePnLCache();
      const filtered = expectAssetPnL(scenario.account, scenario.countervalues, USD, {
        isSpamOperation: scenario.dustPredicate,
        reconcileWithBalance: false,
      });

      expect(filtered.costBasis.lt(baseline.costBasis)).toBe(true);
    });

    it("failed ops are excluded from costBasis (flipping hasFailed=false changes the basis)", () => {
      const baseline = expectAssetPnL(scenario.account, scenario.countervalues, USD, {
        reconcileWithBalance: false,
      });

      const accountWithoutFailures = {
        ...scenario.account,
        operations: scenario.account.operations.map(op => ({ ...op, hasFailed: false })),
      };
      invalidatePnLCache();
      const noFailures = expectAssetPnL(accountWithoutFailures, scenario.countervalues, USD, {
        reconcileWithBalance: false,
      });

      expect(noFailures.costBasis.eq(baseline.costBasis)).toBe(false);
    });
  });

  describe("SingleTrade — one buy ± one full sell, BTC/EUR", () => {
    let scenario: ReturnType<typeof buildSingleTradeScenario>;

    beforeEach(() => {
      scenario = buildSingleTradeScenario();
    });

    describe("held variant — buy + hold (latest price = sell price)", () => {
      let pnl: ReturnType<typeof expectAssetPnL>;

      beforeEach(() => {
        pnl = expectAssetPnL(scenario.heldAccount, scenario.countervalues, EUR);
      });

      it("costBasis = qty × buy price", () => {
        expectBN(pnl.costBasis).toBeCloseToBN(
          scenario.expected.investedEur.times(FIAT_MAJOR_TO_MINOR),
          0,
        );
      });

      it("unrealisedPnL = qty × (latest price − buy price)", () => {
        expectBN(pnl.unrealisedPnL).toBeCloseToBN(
          scenario.expected.grossUnrealisedAtSellPriceEur.times(FIAT_MAJOR_TO_MINOR),
          0,
        );
      });

      it("gross PnL %-vs-costBasis matches the hand-derived scenario figure", () => {
        const pct = pnlPercentage(pnl.totalPnL, pnl.costBasis)!;
        expectBN(pct).toBeCloseToBN(scenario.expected.grossPctOnCostBasis, 2);
      });

      it("fee-adjusted view → €5,571.98 / 37.02% (caller subtracts entry+exit fees, inflates basis by entry fee)", () => {
        const grossPnLEur = pnl.totalPnL.div(FIAT_MAJOR_TO_MINOR);
        const totalFeesEur = scenario.fees.entryEur.plus(scenario.fees.exitEur);
        const netPnLEur = grossPnLEur.minus(totalFeesEur);
        const feeBasisEur = scenario.expected.investedEur.plus(scenario.fees.entryEur);
        const netPctEur = pnlPercentage(netPnLEur, feeBasisEur)!;

        expectBN(netPnLEur).toBeCloseToBN(scenario.expected.feeAdjustedPnLEur, 2);
        expectBN(netPctEur).toBeCloseToBN(scenario.expected.feeAdjustedPctOnInvestmentPlusFee, 2);
      });
    });

    describe("closed variant — buy + full sell", () => {
      let pnl: ReturnType<typeof expectAssetPnL>;

      beforeEach(() => {
        pnl = expectAssetPnL(scenario.closedAccount, scenario.countervalues, EUR);
      });

      it("realisedPnL = qty × (sell price − buy price) on a clean round trip", () => {
        expectBN(pnl.realisedPnL).toBeCloseToBN(
          scenario.expected.grossRealisedPnLEur.times(FIAT_MAJOR_TO_MINOR),
          0,
        );
      });

      it("costBasis = 0 after a full sell (no remaining cost-bearing position)", () => {
        expectBN(pnl.costBasis).toEqualBN(0);
      });

      it("unrealisedPnL = 0 after a full sell (no balance left to revalue)", () => {
        expectBN(pnl.unrealisedPnL).toEqualBN(0);
      });

      it("pnlPercentage(totalPnL, costBasis) = null on a fully closed position (caller must use an invested-amount basis)", () => {
        expect(pnlPercentage(pnl.totalPnL, pnl.costBasis)).toBeNull();
      });

      it("lifetimeCost = invested amount even after a full sell (never decremented)", () => {
        expectBN(pnl.lifetimeCost).toBeCloseToBN(
          scenario.expected.investedEur.times(FIAT_MAJOR_TO_MINOR),
          0,
        );
      });

      it("pnlPercentage(totalPnL, lifetimeCost) recovers the gross %-vs-invested KPI on a closed position", () => {
        const pct = pnlPercentage(pnl.totalPnL, pnl.lifetimeCost)!;
        expectBN(pct).toBeCloseToBN(scenario.expected.grossPctOnCostBasis, 2);
      });
    });

    describe("held variant — lifetimeCost equals running costBasis when no sells happened", () => {
      it("lifetimeCost === costBasis on the held account (every inflow still represented)", () => {
        const pnl = expectAssetPnL(scenario.heldAccount, scenario.countervalues, EUR);
        expectBN(pnl.lifetimeCost).toEqualBN(pnl.costBasis);
      });
    });
  });
});

describe("computePortfolioPnL", () => {
  describe("MultiAsset — BTC + ETH + USDC, in USD", () => {
    let scenario: ReturnType<typeof buildMultiAssetScenario>;

    beforeEach(() => {
      scenario = buildMultiAssetScenario();
    });

    it("portfolio totals = sum of per-account computeAssetPnL (realisedPnL, unrealisedPnL, costBasis, lifetimeCost)", () => {
      const accounts = [scenario.btcAccount, scenario.ethAccount, scenario.usdcAccount];
      const portfolio = computePortfolioPnL(accounts, scenario.countervalues, USD);

      let realised = new BigNumber(0);
      let unrealised = new BigNumber(0);
      let costBasis = new BigNumber(0);
      let lifetimeCost = new BigNumber(0);
      for (const account of accounts) {
        const single = expectAssetPnL(account, scenario.countervalues, USD);
        realised = realised.plus(single.realisedPnL);
        unrealised = unrealised.plus(single.unrealisedPnL);
        costBasis = costBasis.plus(single.costBasis);
        lifetimeCost = lifetimeCost.plus(single.lifetimeCost);
      }

      expectBN(portfolio.realisedPnL).toEqualBN(realised);
      expectBN(portfolio.unrealisedPnL).toEqualBN(unrealised);
      expectBN(portfolio.costBasis).toEqualBN(costBasis);
      expectBN(portfolio.lifetimeCost).toEqualBN(lifetimeCost);
      expectBN(portfolio.totalPnL).toEqualBN(realised.plus(unrealised));
    });

    it("portfolio lifetimeCost ≥ costBasis (sells decrement running basis but not lifetime)", () => {
      const accounts = [scenario.btcAccount, scenario.ethAccount, scenario.usdcAccount];
      const portfolio = computePortfolioPnL(accounts, scenario.countervalues, USD);
      expect(portfolio.lifetimeCost.gte(portfolio.costBasis)).toBe(true);
    });

    it("BTC partial sell: per-asset lifetimeCost > running costBasis", () => {
      const btc = expectAssetPnL(scenario.btcAccount, scenario.countervalues, USD);
      expect(btc.lifetimeCost.gt(btc.costBasis)).toBe(true);
    });

    it("every account with inflows has costBasis > 0", () => {
      for (const account of [scenario.btcAccount, scenario.ethAccount, scenario.usdcAccount]) {
        const pnl = expectAssetPnL(account, scenario.countervalues, USD);
        expectBN(pnl.costBasis).toBePositive();
      }
    });

    it("stable-priced asset (USDC pinned at $1): realisedPnL = 0 and unrealisedPnL ≈ 0", () => {
      const usdcPnL = expectAssetPnL(scenario.usdcAccount, scenario.countervalues, USD);
      expectBN(usdcPnL.realisedPnL).toEqualBN(0);
      expectBN(usdcPnL.unrealisedPnL).toBeCloseToBN(0, 0);
    });
  });

  describe("sub-account flattening (mirrors getPortfolio)", () => {
    let scenario: ReturnType<typeof buildNestedSubAccountScenario>;

    beforeEach(() => {
      scenario = buildNestedSubAccountScenario();
    });

    it("aggregates parent + token sub-account when only the parent is passed", () => {
      const portfolio = computePortfolioPnL([scenario.ethWithUsdc], scenario.countervalues, USD);
      const ethOnly = expectAssetPnL(scenario.ethWithUsdc, scenario.countervalues, USD);
      const usdcOnly = expectAssetPnL(scenario.usdcSub, scenario.countervalues, USD);

      expectBN(portfolio.costBasis).toEqualBN(ethOnly.costBasis.plus(usdcOnly.costBasis));
      expectBN(portfolio.realisedPnL).toEqualBN(ethOnly.realisedPnL.plus(usdcOnly.realisedPnL));
      expectBN(portfolio.unrealisedPnL).toEqualBN(
        ethOnly.unrealisedPnL.plus(usdcOnly.unrealisedPnL),
      );
      expectBN(portfolio.totalPnL).toEqualBN(ethOnly.totalPnL.plus(usdcOnly.totalPnL));
    });

    it("portfolio costBasis > parent-only costBasis (sub-account is included, never dropped)", () => {
      const portfolio = computePortfolioPnL([scenario.ethWithUsdc], scenario.countervalues, USD);
      const ethOnly = expectAssetPnL(scenario.ethWithUsdc, scenario.countervalues, USD);

      expect(portfolio.costBasis.gt(ethOnly.costBasis)).toBe(true);
    });

    it("caller contract: passing [parent, sub] together double-counts the sub (matches getPortfolio.flattenAccounts)", () => {
      const fromTopLevel = computePortfolioPnL([scenario.ethWithUsdc], scenario.countervalues, USD);
      invalidatePnLCache();
      const fromMixed = computePortfolioPnL(
        [scenario.ethWithUsdc, scenario.usdcSub],
        scenario.countervalues,
        USD,
      );
      const usdcOnly = expectAssetPnL(scenario.usdcSub, scenario.countervalues, USD);

      expectBN(fromMixed.costBasis).toEqualBN(fromTopLevel.costBasis.plus(usdcOnly.costBasis));
    });
  });
});
