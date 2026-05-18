import BigNumber from "bignumber.js";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { classifyOperation } from "./classifyOperation";
import type { ComputePnLOptions, CostBasisAcc, CostBasisState, OperationFlow } from "./types";

const ZERO = new BigNumber(0);

export const initialCostBasisState: CostBasisState = {
  totalAmount: ZERO,
  totalCostInCounterValue: ZERO,
  lifetimeCostInCounterValue: ZERO,
  realisedPnL: ZERO,
  averageEntryPrice: ZERO,
  lastOperationId: null,
  lastOperationDate: null,
};

function compareOps(a: Operation, b: Operation): number {
  const da = a.date.getTime();
  const db = b.date.getTime();
  if (da !== db) return da - db;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function isAfterBookmark(op: Operation, prev: CostBasisState): boolean {
  if (prev.lastOperationDate === null) return true;
  const opTime = op.date.getTime();
  const bookTime = prev.lastOperationDate.getTime();
  if (opTime > bookTime) return true;
  if (opTime < bookTime) return false;
  return prev.lastOperationId !== null && op.id > prev.lastOperationId;
}

function applyInflow(acc: CostBasisAcc, value: BigNumber, cvBN: BigNumber): CostBasisAcc {
  const totalCost = acc.totalCost.plus(cvBN);
  const totalAmount = acc.totalAmount.plus(value);
  return {
    totalAmount,
    totalCost,
    lifetimeCost: acc.lifetimeCost.plus(cvBN),
    realised: acc.realised,
    averageEntryPrice: totalAmount.gt(0) ? totalCost.div(totalAmount) : acc.averageEntryPrice,
  };
}

function applyOutflow(acc: CostBasisAcc, value: BigNumber, cvBN: BigNumber): CostBasisAcc {
  if (acc.totalAmount.lte(0)) return acc;

  const sold = BigNumber.minimum(value, acc.totalAmount);
  const costOfSale = sold.times(acc.averageEntryPrice);
  // Scale exit CV proportionally when we clamped a sell that exceeded held amount.
  const exitCV = sold.eq(value) ? cvBN : cvBN.times(sold).div(value);

  return {
    totalAmount: acc.totalAmount.minus(sold),
    totalCost: acc.totalCost.minus(costOfSale),
    // `lifetimeCost` is intentionally untouched on sells — it represents
    // "money put in over the lifetime of the position", not the running
    // basis of remaining coins.
    lifetimeCost: acc.lifetimeCost,
    realised: acc.realised.plus(exitCV.minus(costOfSale)),
    averageEntryPrice: acc.averageEntryPrice,
  };
}

function applyOperation(
  acc: CostBasisAcc,
  op: Operation,
  flow: Exclude<OperationFlow, "ignored">,
  asset: Currency,
  fiat: Currency,
  countervalues: CounterValuesState,
): CostBasisAcc {
  if (op.value.isZero() || op.value.isNegative()) return acc;

  const cvAtDate = calculate(countervalues, {
    value: op.value.toNumber(),
    from: asset,
    to: fiat,
    date: op.date,
    disableRounding: true,
  });
  if (typeof cvAtDate !== "number") return acc;

  const cvBN = new BigNumber(cvAtDate);
  return flow === "inflow" ? applyInflow(acc, op.value, cvBN) : applyOutflow(acc, op.value, cvBN);
}

/**
 * Append-only ACB reducer. Folds `newOps` into `prev` and returns a new
 * `CostBasisState`. Reads ONLY historical countervalues at op dates — never
 * `latest` — so the result is stable under price ticks.
 *
 * Returns `prev` (same reference) when nothing new applies.
 */
export function reduceCostBasis(
  prev: CostBasisState,
  newOps: Operation[],
  account: AccountLike,
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): CostBasisState {
  if (newOps.length === 0) return prev;

  const pending: Operation[] = [];
  for (const op of newOps) {
    if (isAfterBookmark(op, prev)) pending.push(op);
  }
  if (pending.length === 0) return prev;

  pending.sort(compareOps);

  const asset = getAccountCurrency(account);
  const isSpam = options?.isSpamOperation;

  let acc: CostBasisAcc = {
    totalAmount: prev.totalAmount,
    totalCost: prev.totalCostInCounterValue,
    lifetimeCost: prev.lifetimeCostInCounterValue,
    realised: prev.realisedPnL,
    averageEntryPrice: prev.averageEntryPrice,
  };
  let lastOperationId = prev.lastOperationId;
  let lastOperationDate = prev.lastOperationDate;

  for (const op of pending) {
    // Advance the bookmark for every seen op (even ignored ones) so that
    // re-passing the same ops is a true no-op.
    lastOperationId = op.id;
    lastOperationDate = op.date;

    if (isSpam?.(op, account)) continue;

    const flow = classifyOperation(op);
    if (flow === "ignored") continue;

    acc = applyOperation(acc, op, flow, asset, fiat, countervalues);
  }

  return {
    totalAmount: acc.totalAmount,
    totalCostInCounterValue: acc.totalCost,
    lifetimeCostInCounterValue: acc.lifetimeCost,
    realisedPnL: acc.realised,
    averageEntryPrice: acc.averageEntryPrice,
    lastOperationId,
    lastOperationDate,
  };
}
