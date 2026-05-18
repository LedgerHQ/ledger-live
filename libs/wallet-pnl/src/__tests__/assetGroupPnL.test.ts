import BigNumber from "bignumber.js";
import { computeAssetGroupPnL } from "../assetGroupPnL";
import { computeAssetPnL } from "../assetPnL";
import { invalidatePnLCache } from "../costBasisCache";
import { makeAccount } from "../scenarios/accounts";
import { BTC, ETH, USD, SAT, WEI } from "../scenarios/currencies";
import { buy, resetOperationIdCounter } from "../scenarios/operations";
import { buildMultiCV } from "../scenarios/countervalues";
import { expectBN } from "./helpers/bn";

const FIAT_MAJOR_TO_MINOR = new BigNumber(100);

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

describe("computeAssetGroupPnL", () => {
  describe("ETH multi-account aggregation", () => {
    function buildScenario() {
      const countervalues = buildMultiCV([
        {
          pair: { from: ETH, to: USD },
          history: {
            "2025-01-10": 2000,
            "2025-02-15": 2500,
          },
          latest: 3000,
        },
      ]);

      const ethAccountA = makeAccount(ETH, {
        id: "js:2:ethereum:eth-a:",
        operations: [buy(WEI.times(2), new Date(Date.UTC(2025, 0, 10)))],
        balance: WEI.times(2),
      });

      const ethAccountB = makeAccount(ETH, {
        id: "js:2:ethereum:eth-b:",
        operations: [buy(WEI.times(3), new Date(Date.UTC(2025, 1, 15)))],
        balance: WEI.times(3),
      });

      return { countervalues, ethAccountA, ethAccountB };
    }

    it("sums per-account totals (totalPnL, costBasis, lifetimeCost)", () => {
      const { countervalues, ethAccountA, ethAccountB } = buildScenario();
      const pnlA = computeAssetPnL(ethAccountA, countervalues, USD)!;
      const pnlB = computeAssetPnL(ethAccountB, countervalues, USD)!;

      const group = computeAssetGroupPnL([ethAccountA, ethAccountB], countervalues, USD)!;

      expectBN(group.totalPnL).toEqualBN(pnlA.totalPnL.plus(pnlB.totalPnL));
      expectBN(group.costBasis).toEqualBN(pnlA.costBasis.plus(pnlB.costBasis));
      expectBN(group.lifetimeCost).toEqualBN(pnlA.lifetimeCost.plus(pnlB.lifetimeCost));
      expectBN(group.unrealisedPnL).toEqualBN(pnlA.unrealisedPnL.plus(pnlB.unrealisedPnL));
      expectBN(group.realisedPnL).toEqualBN(pnlA.realisedPnL.plus(pnlB.realisedPnL));
    });

    it("totalAmount is the on-chain balance sum in smallest units (wei)", () => {
      const { countervalues, ethAccountA, ethAccountB } = buildScenario();
      const group = computeAssetGroupPnL([ethAccountA, ethAccountB], countervalues, USD)!;

      expectBN(group.totalAmount).toEqualBN(WEI.times(5));
    });

    it("averageEntryPrice is in fiat per full asset unit (USD per ETH)", () => {
      // Account A: 2 ETH bought at $2000 = $4000 cost basis
      // Account B: 3 ETH bought at $2500 = $7500 cost basis
      // Total cost = $11500 (in minor units = 1_150_000), total amount = 5 ETH
      // Expected averageEntryPrice = $11500 / 5 = $2300 (in minor units = 230_000)
      const { countervalues, ethAccountA, ethAccountB } = buildScenario();
      const group = computeAssetGroupPnL([ethAccountA, ethAccountB], countervalues, USD)!;

      const expectedUsd = new BigNumber(2300);
      expectBN(group.averageEntryPrice).toBeCloseToBN(expectedUsd.times(FIAT_MAJOR_TO_MINOR), 0);
    });

    it("averageEntryPrice is finite (not contaminated by wei magnitude)", () => {
      const { countervalues, ethAccountA, ethAccountB } = buildScenario();
      const group = computeAssetGroupPnL([ethAccountA, ethAccountB], countervalues, USD)!;

      expect(group.averageEntryPrice.isFinite()).toBe(true);
      expect(group.averageEntryPrice.lt(new BigNumber(10).pow(15))).toBe(true);
    });
  });

  describe("BTC magnitude correctness", () => {
    it("averageEntryPrice scales correctly with BTC magnitude (1e8)", () => {
      const countervalues = buildMultiCV([
        {
          pair: { from: BTC, to: USD },
          history: { "2025-01-15": 40000 },
          latest: 50000,
        },
      ]);

      const btcAccount = makeAccount(BTC, {
        id: "js:2:bitcoin:btc-a:",
        operations: [buy(SAT.times(1), new Date(Date.UTC(2025, 0, 15)))],
        balance: SAT.times(1),
      });

      const group = computeAssetGroupPnL([btcAccount], countervalues, USD)!;

      const expectedUsd = new BigNumber(40000);
      expectBN(group.averageEntryPrice).toBeCloseToBN(expectedUsd.times(FIAT_MAJOR_TO_MINOR), 0);
    });
  });

  describe("edge cases", () => {
    it("returns null for an empty accounts array", () => {
      const countervalues = buildMultiCV([]);

      expect(computeAssetGroupPnL([], countervalues, USD)).toBeNull();
    });

    it("returns null when no account contributes a usable PnL (no ops, no balance)", () => {
      const countervalues = buildMultiCV([
        { pair: { from: ETH, to: USD }, history: {}, latest: 3000 },
      ]);
      const emptyAccount = makeAccount(ETH, {
        id: "js:2:ethereum:eth-empty:",
        operations: [],
        balance: new BigNumber(0),
      });

      expect(computeAssetGroupPnL([emptyAccount], countervalues, USD)).toBeNull();
    });

    it("returns averageEntryPrice = 0 when totalAmount is zero (fully closed position)", () => {
      const countervalues = buildMultiCV([
        {
          pair: { from: ETH, to: USD },
          history: { "2025-01-10": 2000, "2025-02-10": 3000 },
          latest: 3500,
        },
      ]);
      // Buy 2 ETH then sell 2 ETH ⇒ ops history exists but balance is 0.
      const closedAccount = makeAccount(ETH, {
        id: "js:2:ethereum:eth-closed:",
        operations: [
          buy(WEI.times(2), new Date(Date.UTC(2025, 0, 10))),
          { ...buy(WEI.times(2), new Date(Date.UTC(2025, 1, 10))), type: "OUT" },
        ],
        balance: new BigNumber(0),
      });

      const group = computeAssetGroupPnL([closedAccount], countervalues, USD)!;

      expectBN(group.totalAmount).toEqualBN(0);
      expectBN(group.averageEntryPrice).toEqualBN(0);
    });
  });
});
