import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { ETH, USD, WEI } from "./currencies";
import { makeAccount } from "./accounts";
import { buy, sell, fail, makeOp } from "./operations";
import { buildCV, dailyHistory } from "./countervalues";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

const DUST_THRESHOLD = WEI.times("0.001");

function priceAt(step: number): number {
  let p = 2000;
  for (let i = 0; i < step; i++) {
    const dir = i % 7 < 4 ? 1 : -1;
    const mag = 30 + ((i * 17) % 50);
    p += dir * mag;
  }
  return Math.max(p, 1000);
}

function dateAt(step: number): Date {
  return new Date(Date.UTC(2025, 0, 1 + step * 2));
}

const TOTAL = 80;
const FAILED_INDICES = new Set([7, 23, 51]);
const DUST_INDICES = new Set([3, 14, 27, 40, 65]);

export type TraderScenario = {
  account: Account;
  countervalues: CounterValuesState;
  dustPredicate: (op: Operation) => boolean;
  expected: {
    appliedCount: number;
    failedCount: number;
    dustCount: number;
  };
};

/**
 * "Day-trader" — high-frequency alternating buys/sells with failed + dust ops mixed in.
 *
 * Operations (chronological, 80 total, one every 2 days from 2025-01-01):
 *  - Indices 7, 23, 51: failed ops (`hasFailed=true`, 0.5 ETH) — must be
 *    ignored by `classifyOperation` regardless of nominal type.
 *  - Indices 3, 14, 27, 40, 65: dust ops (value < 0.001 ETH, IN). The
 *    returned `dustPredicate` is meant to be passed as
 *    `options.isSpamOperation` to filter them out of the cost basis.
 *  - All other indices: alternating buy (even) / sell (odd) of 0.1–0.3 ETH
 *    at a deterministic random-walk price ($1000–$2.5k).
 *
 * Counter-values: a historical rate at every op date + `latest = $2500`.
 *
 * Stresses two filter paths in `reduceCostBasis`:
 *  - failed ops are stripped via `classifyOperation` returning "ignored",
 *  - the `isSpamOperation` predicate is honoured and shrinks the cost basis
 *    when filtering small inflows.
 *
 * `expected` exposes counts only (`appliedCount`/`failedCount`/`dustCount`);
 * exact PnL numbers are not pre-computed since the price walk is
 * deterministic but not human-readable.
 */
export function buildTraderScenario(): TraderScenario {
  const operations: Operation[] = [];
  let appliedCount = 0;

  for (let i = 0; i < TOTAL; i++) {
    const date = dateAt(i);

    if (FAILED_INDICES.has(i)) {
      operations.push(fail(i % 2 === 0 ? "IN" : "OUT", WEI.times("0.5"), date));
      continue;
    }
    if (DUST_INDICES.has(i)) {
      operations.push(makeOp({ type: "IN", value: DUST_THRESHOLD.div(2), date }));
      continue;
    }
    const amount = WEI.times(0.1 + (i % 5) * 0.05);
    operations.push(i % 2 === 0 ? buy(amount, date) : sell(amount, date));
    appliedCount++;
  }

  const history = dailyHistory(
    Array.from({ length: TOTAL }, (_, i): [Date, number] => [dateAt(i), priceAt(i)]),
  );

  const finalBalanceWei = (() => {
    let bal = new BigNumber(0);
    for (let i = 0; i < TOTAL; i++) {
      if (FAILED_INDICES.has(i) || DUST_INDICES.has(i)) continue;
      const amount = WEI.times(0.1 + (i % 5) * 0.05);
      if (i % 2 === 0) {
        bal = bal.plus(amount);
      } else {
        bal = BigNumber.maximum(bal.minus(amount), new BigNumber(0));
      }
    }
    return bal;
  })();

  const account = makeAccount(ETH, {
    operations,
    balance: finalBalanceWei,
  });

  const countervalues = buildCV({
    pair: { from: ETH, to: USD },
    history,
    latest: 2500,
  });

  const dustPredicate = (op: Operation): boolean => op.value.lt(DUST_THRESHOLD);

  return {
    account,
    countervalues,
    dustPredicate,
    expected: {
      appliedCount,
      failedCount: FAILED_INDICES.size,
      dustCount: DUST_INDICES.size,
    },
  };
}
