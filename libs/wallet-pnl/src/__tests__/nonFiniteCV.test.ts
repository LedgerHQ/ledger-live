import BigNumber from "bignumber.js";
import { computeAssetPnL } from "../assetPnL";
import { computePortfolioPnL } from "../portfolioPnL";
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

// `calculate()` in @ledgerhq/live-countervalues computes
// `value * rate * mult`. With an `Infinity` latest rate it returns `Infinity`;
// `new BigNumber(Infinity)` coerces to an internal NaN that then poisons every
// downstream arithmetic op in the reducer. These tests pin the guard that
// rejects any non-finite CV at the three call sites in wallet-pnl.

const BUY_DATE = new Date(Date.UTC(2025, 0, 15));

describe("non-finite countervalue — latest rate (assetPnL.ts)", () => {
  it("returns null when latest CV is Infinity and there is no operation history", () => {
    const account = makeAccount(ETH, { balance: WEI.times(5) });
    const countervalues = buildCV({ pair: { from: ETH, to: USD }, latest: Infinity });

    const pnl = computeAssetPnL(account, countervalues, USD);
    expect(pnl).toBeNull();
  });

  it("keeps unrealisedPnL at zero (not NaN) when latest CV is Infinity but ops exist", () => {
    const account = makeAccount(ETH, {
      operations: [buy(WEI.times(5), BUY_DATE)],
      balance: WEI.times(5),
    });
    const countervalues = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, 2000]]),
      latest: Infinity,
    });

    const pnl = computeAssetPnL(account, countervalues, USD)!;
    expect(pnl.unrealisedPnL.isFinite()).toBe(true);
    expectBN(pnl.unrealisedPnL).toEqualBN(0);
  });

  it("portfolio aggregate stays finite when a single asset has an Infinity latest CV", () => {
    const accountWithBuy = makeAccount(ETH, {
      operations: [buy(WEI.times(5), BUY_DATE)],
      balance: WEI.times(5),
    });
    const countervalues = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, 2000]]),
      latest: Infinity,
    });

    const portfolio = computePortfolioPnL([accountWithBuy], countervalues, USD);
    expect(portfolio.unrealisedPnL.isFinite()).toBe(true);
    expect(portfolio.realisedPnL.isFinite()).toBe(true);
    expect(portfolio.totalPnL.isFinite()).toBe(true);
    expect(portfolio.costBasis.isFinite()).toBe(true);
    expect(portfolio.lifetimeCost.isFinite()).toBe(true);
  });
});

describe("non-finite countervalue — historical rate (costBasis.ts)", () => {
  it("skips an inflow whose CV at op date is Infinity (treated like a missing rate)", () => {
    const account = makeAccount(ETH, {
      operations: [buy(WEI.times(5), BUY_DATE)],
      balance: WEI.times(5),
    });
    const countervalues = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, Infinity]]),
      latest: 2400,
    });

    const pnl = computeAssetPnL(account, countervalues, USD)!;

    expect(pnl.costBasis.isFinite()).toBe(true);
    expect(pnl.unrealisedPnL.isFinite()).toBe(true);
    expect(pnl.realisedPnL.isFinite()).toBe(true);

    expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber("1200000"), 0);
  });

  it("opt-out of reconciliation: a rejected op-date CV leaves costBasis at zero", () => {
    const account = makeAccount(ETH, {
      operations: [buy(WEI.times(5), BUY_DATE)],
      balance: WEI.times(5),
    });
    const countervalues = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, Infinity]]),
      latest: 2400,
    });

    const pnl = computeAssetPnL(account, countervalues, USD, {
      reconcileWithBalance: false,
    })!;

    expect(pnl.costBasis.isFinite()).toBe(true);
    expectBN(pnl.costBasis).toEqualBN(0);
    expect(pnl.unrealisedPnL.isFinite()).toBe(true);
  });
});

describe("non-finite countervalue — reconciliation delta (costBasisReconciliation.ts)", () => {
  it("does not apply the synthetic inflow when the delta CV is Infinity", () => {
    const account = makeAccount(ETH, {
      operations: [buy(WEI.times(10), BUY_DATE)],
      balance: WEI.times(12),
    });
    const countervalues = buildCV({
      pair: { from: ETH, to: USD },
      history: dailyHistory([[BUY_DATE, 2000]]),
      latest: Infinity,
    });

    const pnl = computeAssetPnL(account, countervalues, USD)!;
    expect(pnl.reconciliation.isClean).toBe(false);
    expect(pnl.reconciliation.applied).toBe(false);
    expect(pnl.costBasis.isFinite()).toBe(true);
    expect(pnl.unrealisedPnL.isFinite()).toBe(true);
    expectBN(pnl.costBasis).toBeCloseToBN(new BigNumber("2000000"), 0);
  });
});
