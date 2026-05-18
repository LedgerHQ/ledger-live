import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { useAssetPnL, usePortfolioPnL } from "../hooks";
import { computeAssetPnL } from "../assetPnL";
import { computePortfolioPnL } from "../portfolioPnL";
import { invalidatePnLCache } from "../costBasisCache";
import type { AssetPnL, ComputePnLOptions, PortfolioPnL } from "../types";
import { BTC, EUR, USD } from "../scenarios/currencies";
import { makeAccount } from "../scenarios/accounts";
import { resetOperationIdCounter } from "../scenarios/operations";
import { buildSingleTradeScenario } from "../scenarios/singleTrade";
import { buildMultiAssetScenario } from "../scenarios/multiAsset";
import { buildTraderScenario } from "../scenarios/trader";
import { render } from "./helpers/testing";

type AssetProps = {
  account: AccountLike;
  countervalues: CounterValuesState;
  fiat: Currency;
  options?: ComputePnLOptions;
};

type PortfolioProps = {
  accounts: AccountLike[];
  countervalues: CounterValuesState;
  fiat: Currency;
  options?: ComputePnLOptions;
};

function renderAssetHook(initial: AssetProps) {
  return render(
    ({ account, countervalues, fiat, options }: AssetProps) =>
      useAssetPnL(account, countervalues, fiat, options),
    initial,
  );
}

function renderPortfolioHook(initial: PortfolioProps) {
  return render(
    ({ accounts, countervalues, fiat, options }: PortfolioProps) =>
      usePortfolioPnL(accounts, countervalues, fiat, options),
    initial,
  );
}

/** Field-by-field BigNumber equality on the full AssetPnL shape. */
function expectSameAssetPnL(actual: AssetPnL, expected: AssetPnL): void {
  expect(actual.costBasis.isEqualTo(expected.costBasis)).toBe(true);
  expect(actual.lifetimeCost.isEqualTo(expected.lifetimeCost)).toBe(true);
  expect(actual.realisedPnL.isEqualTo(expected.realisedPnL)).toBe(true);
  expect(actual.unrealisedPnL.isEqualTo(expected.unrealisedPnL)).toBe(true);
  expect(actual.totalPnL.isEqualTo(expected.totalPnL)).toBe(true);
  expect(actual.averageEntryPrice.isEqualTo(expected.averageEntryPrice)).toBe(true);
  expect(
    actual.reconciliation.recordedAmount.isEqualTo(expected.reconciliation.recordedAmount),
  ).toBe(true);
  expect(
    actual.reconciliation.onChainBalance.isEqualTo(expected.reconciliation.onChainBalance),
  ).toBe(true);
  expect(actual.reconciliation.delta.isEqualTo(expected.reconciliation.delta)).toBe(true);
  expect(actual.reconciliation.isClean).toBe(expected.reconciliation.isClean);
  expect(actual.reconciliation.applied).toBe(expected.reconciliation.applied);
}

/** Field-by-field BigNumber equality on the (no averageEntryPrice) PortfolioPnL shape. */
function expectSamePortfolioPnL(actual: PortfolioPnL, expected: PortfolioPnL): void {
  expect(actual.costBasis.isEqualTo(expected.costBasis)).toBe(true);
  expect(actual.lifetimeCost.isEqualTo(expected.lifetimeCost)).toBe(true);
  expect(actual.realisedPnL.isEqualTo(expected.realisedPnL)).toBe(true);
  expect(actual.unrealisedPnL.isEqualTo(expected.unrealisedPnL)).toBe(true);
  expect(actual.totalPnL.isEqualTo(expected.totalPnL)).toBe(true);
}

beforeEach(() => {
  invalidatePnLCache();
  resetOperationIdCounter();
});

describe("useAssetPnL — single-trade scenario (BTC held, priced in EUR)", () => {
  let scenario: ReturnType<typeof buildSingleTradeScenario>;
  let baseProps: AssetProps;

  beforeEach(() => {
    scenario = buildSingleTradeScenario();
    baseProps = {
      account: scenario.heldAccount,
      countervalues: scenario.countervalues,
      fiat: EUR,
    };
  });

  it("delegates to computeAssetPnL — every field passes through unchanged", () => {
    const direct = computeAssetPnL(scenario.heldAccount, scenario.countervalues, EUR);
    invalidatePnLCache();
    const { result } = renderAssetHook(baseProps);

    expect(direct).not.toBeNull();
    expectSameAssetPnL(result.current!, direct!);
  });

  it("propagates the null contract — no operations and zero balance returns null", () => {
    const empty = makeAccount(BTC, { operations: [], balance: new BigNumber(0) });
    const { result } = renderAssetHook({ ...baseProps, account: empty });
    expect(result.current).toBeNull();
  });

  it("returns the same reference across renders when inputs are unchanged (stable identity)", () => {
    const { result, rerender } = renderAssetHook(baseProps);
    const first = result.current;
    rerender(baseProps);
    expect(result.current).toBe(first);
  });

  it("recomputes when the account changes — closed variant yields costBasis = 0", () => {
    const { result, rerender } = renderAssetHook(baseProps);
    const first = result.current;
    rerender({ ...baseProps, account: scenario.closedAccount });

    expect(result.current).not.toBe(first);
    expect(result.current!.costBasis.isEqualTo(0)).toBe(true);
  });

  it("recomputes when the fiat changes — EUR → USD returns a fresh AssetPnL", () => {
    const { result, rerender } = renderAssetHook(baseProps);
    const first = result.current;
    rerender({ ...baseProps, fiat: USD });
    expect(result.current).not.toBe(first);
  });
});

describe("useAssetPnL — trader scenario (ETH/USD, isSpamOperation toggle)", () => {
  it("recomputes when options change — switching on isSpamOperation shrinks costBasis", () => {
    const trader = buildTraderScenario();
    // Reducer-mechanics check: the trader fixture's `balance` deliberately
    // disagrees with its op stream (dust IN ops don't appear on-chain), and
    // the always-on reconciliation layer would mask the filtering effect.
    // Disable it to keep this test focused on the cost-basis reducer.
    const initial: AssetProps = {
      account: trader.account,
      countervalues: trader.countervalues,
      fiat: USD,
      options: { reconcileWithBalance: false },
    };
    const { result, rerender } = renderAssetHook(initial);
    const unfiltered = result.current!;

    rerender({
      ...initial,
      options: { isSpamOperation: trader.dustPredicate, reconcileWithBalance: false },
    });
    const filtered = result.current!;

    expect(filtered).not.toBe(unfiltered);
    expect(filtered.costBasis.lt(unfiltered.costBasis)).toBe(true);
  });
});

describe("usePortfolioPnL — multi-asset scenario (BTC + ETH + USDC in USD)", () => {
  let scenario: ReturnType<typeof buildMultiAssetScenario>;
  let baseProps: PortfolioProps;

  beforeEach(() => {
    scenario = buildMultiAssetScenario();
    baseProps = {
      accounts: [scenario.btcAccount, scenario.ethAccount, scenario.usdcAccount],
      countervalues: scenario.countervalues,
      fiat: USD,
    };
  });

  it("delegates to computePortfolioPnL — aggregated totals pass through unchanged", () => {
    const direct = computePortfolioPnL(baseProps.accounts, scenario.countervalues, USD);
    invalidatePnLCache();
    const { result } = renderPortfolioHook(baseProps);
    expectSamePortfolioPnL(result.current, direct);
  });

  it("returns the same reference across renders when inputs are unchanged (stable identity)", () => {
    const { result, rerender } = renderPortfolioHook(baseProps);
    const first = result.current;
    rerender(baseProps);
    expect(result.current).toBe(first);
  });

  it("recomputes when the accounts array changes — new array (same content) yields a fresh PortfolioPnL with equal totals", () => {
    const { result, rerender } = renderPortfolioHook(baseProps);
    const first = result.current;
    rerender({ ...baseProps, accounts: [...baseProps.accounts] });
    const second = result.current;

    expect(second).not.toBe(first);
    expectSamePortfolioPnL(second, first);
  });

  it("returns zeroed totals on an empty accounts list", () => {
    const { result } = renderPortfolioHook({ ...baseProps, accounts: [] });
    const pnl = result.current;
    expect(pnl.costBasis.isEqualTo(0)).toBe(true);
    expect(pnl.lifetimeCost.isEqualTo(0)).toBe(true);
    expect(pnl.realisedPnL.isEqualTo(0)).toBe(true);
    expect(pnl.unrealisedPnL.isEqualTo(0)).toBe(true);
    expect(pnl.totalPnL.isEqualTo(0)).toBe(true);
  });
});
