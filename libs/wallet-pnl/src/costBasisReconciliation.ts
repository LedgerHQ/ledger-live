import BigNumber from "bignumber.js";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { CostBasisState, Reconciliation } from "./types";

const ZERO = new BigNumber(0);

/**
 * Pure detection: compares the operations-derived `state.totalAmount` to the
 * on-chain `balance` and returns the diagnostic. **Never** does any I/O on
 * countervalues, **never** mutates state, **always** returns `applied: false`.
 *
 * The repair step is a separate concern — see {@link applyBalanceReconciliation}.
 * This split lets callers detect anomalies (UI badges, audit logs) without
 * paying the cost of the heuristic repair, and keeps the reducer pipeline
 * trivially testable.
 */
export function detectBalanceGap(state: CostBasisState, balance: BigNumber): Reconciliation {
  const delta = balance.minus(state.totalAmount);
  return {
    recordedAmount: state.totalAmount,
    onChainBalance: balance,
    delta,
    isClean: delta.isZero(),
    applied: false,
  };
}

/**
 * Opinionated repair: when the `gap` shows a non-zero `delta`, folds a
 * synthetic operation into the cost-basis state to close it.
 *
 * - `delta > 0` → synthetic INFLOW valued at the latest counter-value
 *                 (rebase tokens, missing IN op…). Pushes the average
 *                 entry price toward the latest market.
 * - `delta < 0` → synthetic OUTFLOW priced at `state.lastOperationDate`
 *                 (best-effort proxy for the unknown disposal date).
 *                 The realised gain/loss equals `delta_value − sold × AEP`.
 *
 * `lifetimeCostInCounterValue` is intentionally NEVER touched here, even on
 * a positive delta: rebase yield / silent accruals are not real cash
 * investments, so they would distort a "% vs invested" KPI.
 *
 * Returns `applied: false` (and an unchanged state) when:
 * - the gap is clean,
 * - the counter-value lookup for the delta fails,
 * - or a negative delta hits an empty position.
 *
 * Callers that want the combined detect+repair flow with the legacy signature
 * should use {@link reconcileCostBasisWithBalance}.
 */
export function applyBalanceReconciliation(
  state: CostBasisState,
  gap: Reconciliation,
  asset: Currency,
  fiat: Currency,
  countervalues: CounterValuesState,
): { state: CostBasisState; applied: boolean } {
  if (gap.isClean) return { state, applied: false };

  const delta = gap.delta;
  // Negative delta → synthetic disposal of the missing tokens. We don't know
  // when they actually left, so we proxy with the last known operation date
  // (better than `latest` for tax-ish use cases, neutral otherwise).
  // Positive delta → synthetic acquisition; price it at the latest rate
  // because rebase / missed-IN gains accrue continuously up to "now".
  const valuationDate = delta.isPositive() ? null : state.lastOperationDate ?? null;

  const cvAtDelta = calculate(countervalues, {
    value: delta.absoluteValue().toNumber(),
    from: asset,
    to: fiat,
    date: valuationDate,
    disableRounding: true,
  });
  if (typeof cvAtDelta !== "number") {
    return { state, applied: false };
  }

  const cvBN = new BigNumber(cvAtDelta);

  if (delta.isPositive()) {
    const totalAmount = state.totalAmount.plus(delta);
    const totalCostInCounterValue = state.totalCostInCounterValue.plus(cvBN);
    return {
      state: {
        ...state,
        totalAmount,
        totalCostInCounterValue,
        averageEntryPrice: totalAmount.gt(0)
          ? totalCostInCounterValue.div(totalAmount)
          : state.averageEntryPrice,
      },
      applied: true,
    };
  }

  // delta < 0 — apply outflow semantics symmetric to `applyOutflow` in costBasis.ts.
  if (state.totalAmount.lte(0)) {
    return { state, applied: false };
  }
  const sold = BigNumber.minimum(delta.absoluteValue(), state.totalAmount);
  const costOfSale = sold.times(state.averageEntryPrice);
  const exitCV = sold.eq(delta.absoluteValue())
    ? cvBN
    : cvBN.times(sold).div(delta.absoluteValue());

  return {
    state: {
      ...state,
      totalAmount: state.totalAmount.minus(sold),
      totalCostInCounterValue: BigNumber.maximum(
        state.totalCostInCounterValue.minus(costOfSale),
        ZERO,
      ),
      realisedPnL: state.realisedPnL.plus(exitCV.minus(costOfSale)),
    },
    applied: true,
  };
}

/**
 * Legacy combined detect+repair entry point, preserved for API stability.
 * New code should prefer composing {@link detectBalanceGap} and
 * {@link applyBalanceReconciliation} explicitly so the conditional mutation
 * is obvious to the reader.
 *
 * Always returns the {@link Reconciliation} diagnostic so callers can flag
 * the result in the UI (e.g. show a warning badge on the asset row).
 *
 * If `apply` is `false`, the gap is detected but no repair is attempted —
 * `applied` will be `false` regardless of the delta.
 */
export function reconcileCostBasisWithBalance(
  state: CostBasisState,
  balance: BigNumber,
  asset: Currency,
  fiat: Currency,
  countervalues: CounterValuesState,
  apply: boolean,
): { state: CostBasisState; reconciliation: Reconciliation } {
  const gap = detectBalanceGap(state, balance);

  if (gap.isClean || !apply) {
    return { state, reconciliation: gap };
  }

  const result = applyBalanceReconciliation(state, gap, asset, fiat, countervalues);
  return {
    state: result.state,
    reconciliation: { ...gap, applied: result.applied },
  };
}
