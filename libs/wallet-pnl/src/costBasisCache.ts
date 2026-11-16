import type { AccountLike, Operation } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { initialCostBasisState, reduceCostBasis } from "./costBasis";
import { getCostBasisOperations } from "./costBasisOperations";
import { getRateLookup } from "./rateLookup";
import type { ComputePnLOptions, CostBasisState } from "./types";

type CacheEntry = { internalInflowsSignature: string; state: CostBasisState };

const cache = new Map<string, CacheEntry>();

function getLastOpBookmark(ops: Operation[]): { id: string; date: Date | null } {
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
  const { operations, internalInflowsSignature } = getCostBasisOperations(account);

  if (options?.isSpamOperation) {
    return reduceCostBasis(
      initialCostBasisState,
      operations,
      account,
      countervalues,
      fiat,
      options,
    );
  }

  const rateLookup = getRateLookup();
  const { id: lastOpId, date: lastOpDate } = getLastOpBookmark(operations);
  const historyKey = rateLookup.historyKey(countervalues, asset, fiat, lastOpDate);
  const fiatKey = rateLookup.currencyApiId(fiat);
  const key = `${account.id}|${fiatKey}|${lastOpId}|${historyKey}`;

  const hit = cache.get(key);
  if (hit?.internalInflowsSignature === internalInflowsSignature) return hit.state;

  const fresh = reduceCostBasis(
    initialCostBasisState,
    operations,
    account,
    countervalues,
    fiat,
    options,
  );
  rememberCostBasis(account.id, fiatKey, key, { internalInflowsSignature, state: fresh });
  return fresh;
}

function rememberCostBasis(
  accountId: string,
  fiatKey: string,
  key: string,
  entry: CacheEntry,
): void {
  const prefix = `${accountId}|${fiatKey}|`;
  for (const existing of cache.keys()) {
    if (existing.startsWith(prefix)) cache.delete(existing);
  }
  cache.set(key, entry);
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
