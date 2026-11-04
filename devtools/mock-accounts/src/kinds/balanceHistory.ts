import type { AccountOperation } from "@domain/entity-account-operation";
import {
  AccountBalanceHistorySchema,
  DEFAULT_BALANCE_HISTORY_RANGE,
  type BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import type { MockReader } from "../families/types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const RANGES: Record<BalanceHistoryRange, { step: number; count: number }> = {
  day: { step: HOUR, count: 24 },
  week: { step: HOUR, count: 7 * 24 },
  month: { step: DAY, count: 30 },
  year: { step: WEEK, count: 52 },
  all: { step: WEEK, count: 52 },
};

/** What an operation changed its asset's balance by: a send also pays its fee. */
const deltaOf = ({ type, value, fee }: AccountOperation) =>
  type === "IN" ? BigInt(value) : -(BigInt(value) + BigInt(fee));

/** Enough points to reach back to the oldest operation on `all`, never fewer than the range's own. */
function countOf(range: BalanceHistoryRange, operations: AccountOperation[], now: number) {
  const { step, count } = RANGES[range];
  if (range !== "all" || operations.length === 0) return count;
  const oldest = Math.min(...operations.map(op => Date.parse(op.date)));
  return Math.max(count, Math.ceil((now - oldest) / step) + 2);
}

/**
 * Each asset's balance replayed back from the current one through the account's mock operations, so
 * the graph agrees with the operations and ends on the balance; dated back from now, one step of the
 * range apart.
 */
export const balanceHistory: MockReader<"balanceHistory"> = ({ balances, operations }, query) => {
  const range = query?.range ?? DEFAULT_BALANCE_HISTORY_RANGE;
  const all = operations();
  const now = Date.now();
  const { step } = RANGES[range];
  const count = countOf(range, all, now);
  const dates = Array.from({ length: count }, (_, index) => now - (count - 1 - index) * step);
  const series = balances().map(({ assetId, balance }) => {
    const own = all.filter(op => op.assetId === assetId);
    return {
      assetId,
      points: dates.map(date => ({
        date: new Date(date).toISOString(),
        balance: own
          .filter(op => Date.parse(op.date) > date)
          .reduce((total, op) => total - deltaOf(op), BigInt(balance))
          .toString(),
      })),
    };
  });
  return AccountBalanceHistorySchema.parse({ range, series });
};
