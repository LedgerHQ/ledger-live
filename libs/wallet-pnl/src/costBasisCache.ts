import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { initialCostBasisState, reduceCostBasis } from "./costBasis";
import { getRateLookup } from "./rateLookup";
import type { ComputePnLOptions, CostBasisState } from "./types";

const cache = new Map<string, CostBasisState>();

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
  countervalues: unknown,
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

  const rateLookup = getRateLookup();
  const { id: lastOpId, date: lastOpDate } = getLastOpBookmark(account);
  const historyKey = rateLookup.historyKey(countervalues, asset, fiat, lastOpDate);
  const fiatKey = rateLookup.currencyApiId(fiat);
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
