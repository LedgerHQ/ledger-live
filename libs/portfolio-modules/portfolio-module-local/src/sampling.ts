import type { AccountOperation } from "@ledgerhq/account-module-framework";
import type { BalanceRange } from "@ledgerhq/portfolio-module-framework";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const WINDOWS: Record<Exclude<BalanceRange, "all">, { window: number; step: number }> = {
  hour: { window: HOUR, step: 5 * MINUTE },
  day: { window: DAY, step: HOUR },
  week: { window: 7 * DAY, step: 6 * HOUR },
  month: { window: 30 * DAY, step: DAY },
  year: { window: 365 * DAY, step: 7 * DAY },
};

/** "all" samples daily, or less often so that it never exceeds this many points. */
export const MAX_ALL_POINTS = 365;

function samplingOf(range: BalanceRange, now: number, since: number) {
  if (range !== "all") return { from: now - WINDOWS[range].window, step: WINDOWS[range].step };
  const from = Math.min(since, now);
  return { from, step: DAY * Math.max(1, Math.ceil((now - from) / (DAY * MAX_ALL_POINTS))) };
}

/**
 * Sample times of a range, oldest first: on step boundaries, then `now`. "all" starts at `since`,
 * the oldest operation.
 */
export function sampleTimes(range: BalanceRange, now: number, since = now): number[] {
  const { from, step } = samplingOf(range, now, since);
  const times: number[] = [];
  for (let time = Math.ceil(from / step) * step; time < now; time += step) times.push(time);
  times.push(now);
  return times;
}

const INCOMING_TYPES: ReadonlySet<string> = new Set(["IN", "REWARD", "REWARD_PAYOUT"]);
const NEUTRAL_TYPES: ReadonlySet<string> = new Set(["NONE"]);

/** The signed change of the balance of the operation asset. */
export function balanceChange(operation: AccountOperation): bigint {
  if (operation.failed) return operation.asset.type === "native" ? -operation.fee : 0n;
  if (INCOMING_TYPES.has(operation.type)) return operation.value;
  if (NEUTRAL_TYPES.has(operation.type)) return 0n;
  return -operation.value;
}

/**
 * The balance at each of `times` (oldest first), computed backwards from the `current` balance
 * through `operations` (newest first).
 */
export function balancesAt(
  times: number[],
  current: bigint,
  operations: AccountOperation[],
): bigint[] {
  const balances: bigint[] = [];
  let balance = current;
  let next = 0;
  for (let index = times.length - 1; index >= 0; index--) {
    while (next < operations.length && operations[next].date.getTime() > times[index]) {
      balance -= balanceChange(operations[next]);
      next++;
    }
    balances[index] = balance;
  }
  return balances;
}
