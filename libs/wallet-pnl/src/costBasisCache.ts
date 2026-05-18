import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { lenseRateMap } from "@ledgerhq/live-countervalues/logic";
import { formatCounterValueDay, inferCurrencyAPIID } from "@ledgerhq/live-countervalues/helpers";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { initialCostBasisState, reduceCostBasis } from "./costBasis";
import type { ComputePnLOptions, CostBasisState } from "./types";

const cache = new Map<string, CostBasisState>();

function getHistoryKey(
  state: CounterValuesState,
  from: Currency,
  to: Currency,
  lastOpDate: Date | null,
): string {
  if (inferCurrencyAPIID(from) === inferCurrencyAPIID(to)) return "identity";
  const pairCache = lenseRateMap(state, { from, to });
  if (!pairCache) return "noCV";
  const { oldest, earliest, earliestStableDate } = pairCache.stats;
  const bucket = lastOpDate ? formatCounterValueDay(lastOpDate) : "0";
  const earliestRelevant = earliest && earliest <= bucket ? earliest : "";
  return `${oldest ?? "_"}|${earliestStableDate ?? "_"}|${earliestRelevant}`;
}

function getLastOpBookmark(account: AccountLike): { id: string; date: Date | null } {
  const ops = account.operations;
  if (ops.length === 0) return { id: "_", date: null };

  let best = ops[0];
  for (let i = 1; i < ops.length; i++) {
    const op = ops[i];
    const opTime = op.date.getTime();
    const bestTime = best.date.getTime();
    if (opTime > bestTime || (opTime === bestTime && op.id > best.id)) best = op;
  }
  return { id: best.id, date: best.date };
}

export function getCostBasis(
  account: AccountLike,
  fiat: Currency,
  countervalues: CounterValuesState,
  options?: ComputePnLOptions,
): CostBasisState {
  const asset = getAccountCurrency(account);

  if (options?.isSpamOperation) {
    return reduceCostBasis(
      initialCostBasisState,
      account.operations,
      account,
      countervalues,
      fiat,
      options,
    );
  }

  const { id: lastOpId, date: lastOpDate } = getLastOpBookmark(account);
  const historyKey = getHistoryKey(countervalues, asset, fiat, lastOpDate);
  const fiatKey = inferCurrencyAPIID(fiat);
  const key = `${account.id}|${fiatKey}|${lastOpId}|${historyKey}`;

  const hit = cache.get(key);
  if (hit) return hit;

  const fresh = reduceCostBasis(
    initialCostBasisState,
    account.operations,
    account,
    countervalues,
    fiat,
    options,
  );
  cache.set(key, fresh);
  return fresh;
}

export function invalidatePnLCache(accountId?: string): void {
  if (!accountId) {
    cache.clear();
    return;
  }
  const prefix = `${accountId}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
