import BigNumber from "bignumber.js";
import { applyBalanceReconciliation, detectBalanceGap } from "../costBasisReconciliation";
import { initialCostBasisState } from "../costBasis";
import { ETH, USD, WEI } from "../scenarios/currencies";
import { buildCV, dailyHistory } from "../scenarios/countervalues";
import type { CostBasisState } from "../types";
import { expectBN } from "./helpers/bn";

const BUY_DATE = new Date(Date.UTC(2025, 0, 15));
const LATEST_DATE = new Date(Date.UTC(2025, 6, 1));
const BUY_PRICE = 2000;
const LATEST_PRICE = 2400;

function stateAt({
  amountWei,
  costMinor,
  aepMinorPerAtom,
  lastDate = BUY_DATE,
}: {
  amountWei: BigNumber;
  costMinor: BigNumber;
  aepMinorPerAtom: BigNumber;
  lastDate?: Date | null;
}): CostBasisState {
  return {
    ...initialCostBasisState,
    totalAmount: amountWei,
    totalCostInCounterValue: costMinor,
    lifetimeCostInCounterValue: costMinor,
    averageEntryPrice: aepMinorPerAtom,
    lastOperationDate: lastDate,
    lastOperationId: lastDate === null ? null : "op-1",
  };
}

const tenEthState = (lastDate: Date | null = BUY_DATE) =>
  stateAt({
    amountWei: WEI.times(10),
    // 10 ETH × $2000 = $20,000 ⇒ 2,000,000 cents (USD minor) ⇒ × 1 (fiat magnitude wraps elsewhere).
    // For these tests we don't need the exact magnitude; we just need consistent units between
    // costMinor and AEP × amountWei. We model "minor units per atomic crypto unit", with
    // AEP = costMinor / amountWei = 2_000_000 / 1e19 = 2e-13 — a tiny BigNumber that's fine.
    costMinor: new BigNumber(2_000_000),
    aepMinorPerAtom: new BigNumber(2_000_000).div(WEI.times(10)),
    lastDate,
  });

describe("detectBalanceGap (pure)", () => {
  it("reports isClean=true and delta=0 when balance equals recordedAmount", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(10));

    expect(gap.isClean).toBe(true);
    expect(gap.applied).toBe(false);
    expectBN(gap.delta).toEqualBN(0);
    expectBN(gap.recordedAmount).toEqualBN(WEI.times(10));
    expectBN(gap.onChainBalance).toEqualBN(WEI.times(10));
  });

  it("reports a negative delta when on-chain balance < recordedAmount", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(1));

    expect(gap.isClean).toBe(false);
    expect(gap.applied).toBe(false);
    expectBN(gap.delta).toEqualBN(WEI.times(-9));
  });

  it("reports a positive delta when on-chain balance > recordedAmount", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(12));

    expect(gap.isClean).toBe(false);
    expect(gap.applied).toBe(false);
    expectBN(gap.delta).toEqualBN(WEI.times(2));
  });

  it("handles a fresh state with no recorded amount: any positive balance ⇒ positive delta", () => {
    const gap = detectBalanceGap(initialCostBasisState, WEI.times(5));

    expect(gap.isClean).toBe(false);
    expectBN(gap.delta).toEqualBN(WEI.times(5));
    expectBN(gap.recordedAmount).toEqualBN(0);
  });
});

describe("applyBalanceReconciliation (CV-aware repair)", () => {
  const cleanCV = buildCV({
    pair: { from: ETH, to: USD },
    history: dailyHistory([
      [BUY_DATE, BUY_PRICE],
      [LATEST_DATE, LATEST_PRICE],
    ]),
    latest: LATEST_PRICE,
  });

  it("is a no-op when the gap is clean", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(10));
    const result = applyBalanceReconciliation(state, gap, ETH, USD, cleanCV);

    expect(result.applied).toBe(false);
    expect(result.state).toBe(state);
  });

  it("returns applied=false (and unchanged state) when the CV lookup fails", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(1));
    const emptyCV = { data: {}, status: {}, cache: {} };
    const result = applyBalanceReconciliation(state, gap, ETH, USD, emptyCV);

    expect(result.applied).toBe(false);
    expect(result.state).toBe(state);
  });

  it("positive delta: folds a synthetic inflow valued at the latest rate", () => {
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(12));
    const result = applyBalanceReconciliation(state, gap, ETH, USD, cleanCV);

    expect(result.applied).toBe(true);
    expectBN(result.state.totalAmount).toEqualBN(WEI.times(12));
    // Original cost ($20,000 = 2_000_000 minor) + synthetic 2 ETH × $2400 = $4,800 = 480_000 minor
    expectBN(result.state.totalCostInCounterValue).toBeCloseToBN(new BigNumber("2480000"), 0);
    // lifetimeCost stays at original — synthetic accruals don't count as cash invested.
    expectBN(result.state.lifetimeCostInCounterValue).toEqualBN(new BigNumber(2_000_000));
  });

  it("negative delta: synthetic outflow uses lastOperationDate price and accrues realised PnL", () => {
    // Use a CV where the buy and the disposal happened at the same $2000 — synthetic
    // disposal should net zero realised PnL.
    const flatCV = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, BUY_PRICE]]),
      latest: BUY_PRICE,
    });
    const state = tenEthState();
    const gap = detectBalanceGap(state, WEI.times(1));
    const result = applyBalanceReconciliation(state, gap, ETH, USD, flatCV);

    expect(result.applied).toBe(true);
    expectBN(result.state.totalAmount).toEqualBN(WEI.times(1));
    // 1 ETH × $2000 entry price = $2000 minor = 200_000 cents.
    expectBN(result.state.totalCostInCounterValue).toBeCloseToBN(new BigNumber("200000"), 0);
    // Synthetic 9 ETH disposal valued at $2000 (same as AEP) ⇒ realised ≈ 0.
    expectBN(result.state.realisedPnL).toBeCloseToBN(new BigNumber("0"), 0);
    // lifetimeCost is never decremented by outflows (synthetic or not).
    expectBN(result.state.lifetimeCostInCounterValue).toEqualBN(new BigNumber(2_000_000));
  });

  it("negative delta on an empty position is a no-op (guarded by totalAmount<=0)", () => {
    const emptyState: CostBasisState = {
      ...initialCostBasisState,
      lastOperationDate: BUY_DATE,
      lastOperationId: "op-1",
    };
    const gap = detectBalanceGap(emptyState, WEI.times(-3));

    expect(gap.isClean).toBe(false);
    expectBN(gap.delta).toEqualBN(WEI.times(-3));

    const result = applyBalanceReconciliation(emptyState, gap, ETH, USD, cleanCV);

    expect(result.applied).toBe(false);
    expect(result.state).toBe(emptyState);
  });

  it("positive delta on an initial state still produces a valid synthetic inflow", () => {
    // No prior ops at all — balance appeared out of thin air (rebase-only token).
    const gap = detectBalanceGap(initialCostBasisState, WEI.times(2));
    const result = applyBalanceReconciliation(initialCostBasisState, gap, ETH, USD, cleanCV);

    expect(result.applied).toBe(true);
    expectBN(result.state.totalAmount).toEqualBN(WEI.times(2));
    // 2 ETH × $2400 latest = $4,800 = 480_000 minor.
    expectBN(result.state.totalCostInCounterValue).toBeCloseToBN(new BigNumber("480000"), 0);
    // lifetimeCost stays at zero — synthetic inflow doesn't count as cash invested.
    expectBN(result.state.lifetimeCostInCounterValue).toEqualBN(0);
  });
});
