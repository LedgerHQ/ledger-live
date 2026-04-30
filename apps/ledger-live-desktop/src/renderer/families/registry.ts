import type { Account, TransactionCommon, TransactionStatusCommon, Operation } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "./types";
import { lldFamilyLoaders } from "./loaders";

// oxlint-disable-next-line typescript/no-explicit-any
type AnyLLDCoinFamily = LLDCoinFamily<any, any, any, any>;

const cache = new Map<string, AnyLLDCoinFamily>();
const inFlight = new Map<string, Promise<AnyLLDCoinFamily>>();
const loaderMap = new Map(lldFamilyLoaders.map(l => [l.family, l.importFamily]));

export function getCachedLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string): LLDCoinFamily<A, T, TS, O> | null {
  return (cache.get(name) as LLDCoinFamily<A, T, TS, O>) ?? null;
}

export function importLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string): Promise<LLDCoinFamily<A, T, TS, O>> {
  const cached = cache.get(name);
  if (cached) return Promise.resolve(cached as LLDCoinFamily<A, T, TS, O>);

  const existing = inFlight.get(name);
  if (existing) return existing as Promise<LLDCoinFamily<A, T, TS, O>>;

  const loader = loaderMap.get(name);
  if (!loader) return Promise.resolve({} as LLDCoinFamily<A, T, TS, O>);

  const promise = loader().then(({ default: impl }) => {
    cache.set(name, impl);
    inFlight.delete(name);
    return impl as LLDCoinFamily<A, T, TS, O>;
  });
  inFlight.set(name, promise);
  return promise;
}
