import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { buy, makeOp, sell } from "@ledgerhq/wallet-pnl/scenarios";
import { parseBn } from "../../../shared/formatting";
import type { TraderOpKind, TraderOpRow } from "./types";

export type ParsedRow = {
  kind: TraderOpKind;
  amountAtomic: BigNumber;
  priceUsd: BigNumber;
  date: Date;
};

/** Parses a `YYYY-MM-DD` string into a UTC `Date`. Returns `null` on invalid. */
function parseIsoDate(s: string): Date | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Skips rows whose date / amount / price can't produce a valid operation. */
export function parseRows(rows: TraderOpRow[], scale: BigNumber): ParsedRow[] {
  const out: ParsedRow[] = [];
  for (const row of rows) {
    const date = parseIsoDate(row.date);
    if (!date) continue;
    const amountMajor = parseBn(row.amount);
    if (!amountMajor.isPositive()) continue;
    const priceUsd = parseBn(row.priceUsd);
    if (!priceUsd.isPositive()) continue;
    const amountAtomic = amountMajor.times(scale).integerValue(BigNumber.ROUND_FLOOR);
    out.push({ kind: row.kind, amountAtomic, priceUsd, date });
  }
  return out;
}

export function makeOperation(parsed: ParsedRow): Operation {
  switch (parsed.kind) {
    case "IN":
      return buy(parsed.amountAtomic, parsed.date);
    case "OUT":
      return sell(parsed.amountAtomic, parsed.date);
    case "FEES":
      return makeOp({ type: "FEES", value: parsed.amountAtomic, date: parsed.date });
  }
}

/**
 * Folds an array of parsed rows into a net atomic balance. IN adds, OUT and
 * FEES subtract (both are out-flows from a cost-basis perspective — see
 * `OPERATION_TYPE_OUT_FAMILY`). Negative balances are floored at zero so the
 * account stays in the realm of valid sim states.
 */
export function computeFinalBalanceAtomic(parsed: ParsedRow[]): BigNumber {
  let bal = new BigNumber(0);
  for (const row of parsed) {
    if (row.kind === "IN") {
      bal = bal.plus(row.amountAtomic);
    } else {
      bal = bal.minus(row.amountAtomic);
    }
  }
  return BigNumber.maximum(bal, new BigNumber(0));
}

export function countByKind(parsed: ParsedRow[]) {
  let inCount = 0;
  let outCount = 0;
  let feesCount = 0;
  for (const r of parsed) {
    if (r.kind === "IN") inCount++;
    else if (r.kind === "OUT") outCount++;
    else feesCount++;
  }
  return { inCount, outCount, feesCount };
}
