import type { BigNumber } from "bignumber.js";
import type { AccountLike, Operation } from "@ledgerhq/types-live";

/**
 * Shared fiat-denominated PnL totals (chosen counter-currency, e.g. USD).
 * Portfolio-level uses this shape only: no single `averageEntryPrice` across
 * mixed assets (BTC@$40k and ETH@$2k are not meaningfully averaged).
 *
 * Two cost figures coexist on purpose:
 * - `costBasis` is the **running** ACB cost of coins still held. It is
 *   decremented on every sell (proportional to `averageEntryPrice`), so it
 *   collapses toward 0 as a position is closed. That makes it the right
 *   denominator for `unrealisedPnL` (mark-to-market on what's left).
 * - `lifetimeCost` is the **cumulative** fiat amount paid for inflows over
 *   the position's lifetime, **never** decremented by sells. It is the
 *   right denominator for a "% vs invested" KPI, which stays meaningful
 *   for partially / fully closed positions where `costBasis → 0`.
 */
export type PortfolioPnL = {
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  totalPnL: BigNumber;
  costBasis: BigNumber;
  lifetimeCost: BigNumber;
};

/**
 * Per-asset metrics: same totals as {@link PortfolioPnL} plus
 * `averageEntryPrice` in counter-currency per unit of the asset (e.g. USD per BTC),
 * and a {@link Reconciliation} block describing how the operations-derived
 * holding was rebalanced against the on-chain `account.balance`.
 */
export type AssetPnL = PortfolioPnL & {
  averageEntryPrice: BigNumber;
  reconciliation: Reconciliation;
};

/**
 * Aggregated PnL for accounts that all hold the **same asset**.
 * - `totalAmount`: cumulative on-chain balance, in the asset's smallest unit (sat, wei…).
 * - `averageEntryPrice`: cost-weighted price in fiat per full asset unit (e.g. USD per BTC).
 */
export type AssetGroupPnL = PortfolioPnL & {
  totalAmount: BigNumber;
  averageEntryPrice: BigNumber;
};

/**
 * Diagnostic for the gap between what the operations stream cumulatively
 * implies (`recordedAmount`) and what the chain reports (`onChainBalance`).
 *
 * A non-`isClean` reconciliation happens when some operation that moved the
 * asset never made it into `account.operations` (typical example: ERC-20
 * `transferFrom` triggered by a router after an `APPROVE`, where only the
 * `APPROVE` is attributed to the user's wallet) or when the asset itself
 * accrues silently (rebase tokens, stETH-like).
 *
 * Unless `ComputePnLOptions.reconcileWithBalance` is `false`, the cost-basis
 * state is adjusted to make `recordedAmount === onChainBalance` and the
 * delta is folded into either `realisedPnL` (negative delta → synthetic
 * outflow at the average entry price, gain/loss valued at the date proxy)
 * or `costBasis` / `averageEntryPrice` (positive delta → synthetic inflow
 * at the latest known rate).
 */
export type Reconciliation = {
  /** Final `totalAmount` from the cost-basis reducer, before any rebalance. */
  recordedAmount: BigNumber;
  /** `account.balance` at the time of the computation. */
  onChainBalance: BigNumber;
  /** `onChainBalance − recordedAmount` (signed). Zero ⇒ nothing to do. */
  delta: BigNumber;
  /** True if `delta` is exactly zero (no synthetic op was applied). */
  isClean: boolean;
  /** True when a synthetic operation was folded into the cost-basis state. */
  applied: boolean;
};

/**
 * Cumulative cost-basis state for a single asset. Produced by the
 * `reduceCostBasis` reducer and cached by `getCostBasis`.
 *
 * - Stable under `latest` countervalue ticks (only `historical` rates feed into it).
 * - Append-only: passing a previous state + new operations resumes from where it left off.
 */
export type CostBasisState = {
  totalAmount: BigNumber;
  totalCostInCounterValue: BigNumber;
  /**
   * Cumulative fiat cost of every inflow seen, **never** decremented by
   * sells. Tracks "lifetime invested" so `% vs cost` stays meaningful on
   * partially / fully closed positions where `totalCostInCounterValue → 0`.
   * Synthetic inflows added by {@link Reconciliation} are NOT counted here
   * (rebase / silent accruals are not real cash investments).
   */
  lifetimeCostInCounterValue: BigNumber;
  realisedPnL: BigNumber;
  averageEntryPrice: BigNumber;
  lastOperationId: string | null;
  lastOperationDate: Date | null;
};

export type CostBasisAcc = {
  totalAmount: BigNumber;
  totalCost: BigNumber;
  /** See {@link CostBasisState.lifetimeCostInCounterValue}. */
  lifetimeCost: BigNumber;
  realised: BigNumber;
  averageEntryPrice: BigNumber;
};

export type OperationFlow = "inflow" | "outflow" | "ignored";

export type ComputePnLOptions = {
  isSpamOperation?: (op: Operation, account: AccountLike) => boolean;
  /**
   * When `true` (default), if the chain balance disagrees with the cumulative
   * inflow-minus-outflow from operations, a synthetic operation is folded
   * into the cost-basis state to close the gap. This is what most consumers
   * want — it stops the UI from showing wildly negative `unrealisedPnL` for
   * tokens whose outflows weren't captured (ERC-20 `transferFrom` etc.).
   *
   * Set to `false` to expose the raw, unreconciled values (useful for tax
   * exports where every cost-basis change must trace back to a real op).
   * The {@link Reconciliation} diagnostic is always produced regardless.
   */
  reconcileWithBalance?: boolean;
};
