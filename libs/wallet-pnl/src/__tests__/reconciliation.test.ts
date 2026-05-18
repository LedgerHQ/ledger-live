import BigNumber from "bignumber.js";
import { computeAssetPnL } from "../assetPnL";
import { invalidatePnLCache } from "../costBasisCache";
import { ETH, USD, WEI } from "../scenarios/currencies";
import { makeAccount } from "../scenarios/accounts";
import { buy, resetOperationIdCounter } from "../scenarios/operations";
import { buildCV, dailyHistory } from "../scenarios/countervalues";
import { expectBN } from "./helpers/bn";

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

const BUY_DATE = new Date(Date.UTC(2025, 0, 15));
const LATEST_DATE = new Date(Date.UTC(2025, 6, 1));
const BUY_PRICE = 2000;
const LATEST_PRICE = 2400;

function buildScenario({ balanceWei }: { balanceWei: BigNumber }) {
  const account = makeAccount(ETH, {
    operations: [buy(WEI.times(10), BUY_DATE)],
    balance: balanceWei,
  });
  const countervalues = buildCV({
    pair: { from: ETH, to: USD },
    history: dailyHistory([[BUY_DATE, BUY_PRICE]]),
    latest: LATEST_PRICE,
  });
  return { account, countervalues };
}

describe("computeAssetPnL — balance reconciliation (Fix 1)", () => {
  describe("clean account (balance equals net of operations)", () => {
    it("reports isClean=true and applied=false; PnL is unchanged from the raw reducer", () => {
      const { account, countervalues } = buildScenario({ balanceWei: WEI.times(10) });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      expect(pnl.reconciliation.isClean).toBe(true);
      expect(pnl.reconciliation.applied).toBe(false);
      expectBN(pnl.reconciliation.delta).toEqualBN(0);
      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI.times(10));
      expectBN(pnl.reconciliation.onChainBalance).toEqualBN(WEI.times(10));
    });
  });

  describe("missing outflow (chain balance < cumulative-from-ops)", () => {
    // Models the WETH-after-`approve` case: 10 ETH bought, but on-chain we
    // only see 1 ETH because 9 ETH were pulled by a router (no OUT op).
    const balanceWei = WEI.times(1);

    it("recordedAmount and onChainBalance reflect the divergence (delta = -9 ETH)", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      expectBN(pnl.reconciliation.recordedAmount).toEqualBN(WEI.times(10));
      expectBN(pnl.reconciliation.onChainBalance).toEqualBN(balanceWei);
      expectBN(pnl.reconciliation.delta).toEqualBN(WEI.times(-9));
      expect(pnl.reconciliation.isClean).toBe(false);
      expect(pnl.reconciliation.applied).toBe(true);
    });

    it("costBasis is dégonflé to averageEntryPrice × balance (≈ $2,000 instead of $20,000)", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      // 1 ETH × $2000 entry price = $2000 (in fiat-minor units = cents)
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber("200000"), 0);
    });

    it("realisedPnL absorbs the disposed value at the last-known op date proxy", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      // 9 ETH disposed at BUY_DATE proxy ($2000) − 9 × $2000 cost = $0.
      // (No price action between buy and the missing outflow date in this fixture.)
      expectBN(pnl.realisedPnL).toEqualBN(0);
    });

    it("unrealisedPnL is sane: 1 ETH × ($2400 − $2000) = +$400 (not the catastrophic −$22,000)", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      expectBN(pnl.unrealisedPnL).toBeCloseToBN(new BigNumber("40000"), 0);
    });

    it("opt-out: passing reconcileWithBalance=false restores the raw catastrophic numbers", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const raw = computeAssetPnL(account, countervalues, USD, {
        reconcileWithBalance: false,
      })!;

      // Raw cost basis = full 10 × $2000 = $20,000, never dégonflé.
      expectBN(raw.costBasis).toBeCloseToBN(new BigNumber("2000000"), 0);
      // Raw unrealised = 1 ETH × $2400 − $20,000 = −$17,600.
      expectBN(raw.unrealisedPnL).toBeCloseToBN(new BigNumber("-1760000"), 0);
      // Diagnostic still shows the gap, but applied=false.
      expect(raw.reconciliation.isClean).toBe(false);
      expect(raw.reconciliation.applied).toBe(false);
    });

    it("totalPnL = realisedPnL + unrealisedPnL after reconciliation", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;
      expectBN(pnl.totalPnL).toEqualBN(pnl.realisedPnL.plus(pnl.unrealisedPnL));
    });

    it("lifetimeCost reflects the original 10 ETH × $2000 = $20,000 — synthetic outflow does NOT decrement it", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;
      expectBN(pnl.lifetimeCost).toBeCloseToBN(new BigNumber("2000000"), 0);
    });
  });

  describe("missing inflow / silent accrual (chain balance > cumulative-from-ops)", () => {
    // Models a rebase-token-like situation: ops register 10 ETH bought, but
    // the balance grew to 12 ETH on its own (rebase, missed IN).
    const balanceWei = WEI.times(12);

    it("delta = +2 ETH; reconciliation applied", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      expectBN(pnl.reconciliation.delta).toEqualBN(WEI.times(2));
      expect(pnl.reconciliation.applied).toBe(true);
    });

    it("costBasis grows by (delta × latest price) — the synthetic inflow is valued at latest", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      // Original 10 × $2000 = $20,000  +  synthetic 2 × $2400 = $4,800  →  $24,800.
      expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber("2480000"), 0);
    });

    it("averageEntryPrice is pulled toward latest by the synthetic accrual (above the historical $2000)", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnlReconciled = computeAssetPnL(account, countervalues, USD)!;
      const pnlRaw = computeAssetPnL(account, countervalues, USD, {
        reconcileWithBalance: false,
      })!;

      // Reconciliation re-anchors AEP toward the latest price ($2400 > $2000).
      // Comparing the two same-units values sidesteps cents-per-wei vs $/ETH.
      expect(pnlReconciled.averageEntryPrice.gt(pnlRaw.averageEntryPrice)).toBe(true);
    });

    it("unrealisedPnL = original 10 ETH × ($2400−$2000) + synthetic 2 ETH × ($2400−$2400) = +$4,000", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;

      expectBN(pnl.unrealisedPnL).toBeCloseToBN(new BigNumber("400000"), 0);
    });

    it("lifetimeCost = $20,000 — synthetic inflow (rebase yield, not real cash) is NOT counted", () => {
      const { account, countervalues } = buildScenario({ balanceWei });
      const pnl = computeAssetPnL(account, countervalues, USD)!;
      expectBN(pnl.lifetimeCost).toBeCloseToBN(new BigNumber("2000000"), 0);
    });
  });

  describe("countervalue lookup fails for the delta", () => {
    it("returns null when there is no CV at all (no historical buys can be valued)", () => {
      const account = makeAccount(ETH, {
        operations: [buy(WEI.times(10), BUY_DATE)],
        balance: WEI.times(1),
      });
      const emptyCV = { data: {}, status: {}, cache: {} };
      const pnl = computeAssetPnL(account, emptyCV, USD);
      expect(pnl).toBeNull();
    });
  });
});
