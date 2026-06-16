import type {
  Account,
  TransactionCommon,
  TransactionStatusCommon,
  Operation,
} from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "./types";
import { lldFamilyLoaders } from "./loaders";
import { preloadCoinModals } from "./modals-loaders";

// oxlint-disable-next-line typescript/no-explicit-any
type AnyLLDCoinFamily = LLDCoinFamily<any, any, any, any>;

const loaderMap = new Map(lldFamilyLoaders.map(l => [l.family, l.importFamily]));

// Cache the promise (not the value) so its reference is stable and React.use() never re-suspends.
// Null-prototype map so a family name like "__proto__" can't pollute the cache's prototype.
const familyPromiseCache: Record<string, Promise<AnyLLDCoinFamily>> = Object.create(null);

// Attach React use() hint fields so the promise resolves synchronously after settlement.
function annotatePromise<T>(p: Promise<T>): Promise<T> {
  p.then(
    value => {
      Object.assign(p, { status: "fulfilled", value });
    },
    reason => {
      Object.assign(p, { status: "rejected", reason });
    },
  );
  return p;
}

// Unknown families resolve to a shared frozen `{}`, synchronously fulfilled so use() never suspends.
// The hint `value` is the same (frozen) object the promise resolves with.
const emptyFamily = Object.freeze({}) as AnyLLDCoinFamily;
const unknownFamily = Object.assign(Promise.resolve(emptyFamily), {
  status: "fulfilled",
  value: emptyFamily,
}) as Promise<AnyLLDCoinFamily>;

// Retry a failed dynamic import a few times — chunk-load failures are usually transient.
function importWithRetry<T>(loader: () => Promise<T>, attempts = 3): Promise<T> {
  return loader().catch(error => {
    if (attempts <= 1) throw error;
    return importWithRetry(loader, attempts - 1);
  });
}

export function importLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string): Promise<LLDCoinFamily<A, T, TS, O>> {
  const loader = loaderMap.get(name);
  if (!loader) return unknownFamily as Promise<LLDCoinFamily<A, T, TS, O>>;

  // Never evict on failure: a fresh promise per render would re-suspend forever (infinite spinner).
  // Rejections stay cached, like live-common's bridge cache (libs/ledger-live-common/src/bridge/impl.ts).
  if (!familyPromiseCache[name]) {
    familyPromiseCache[name] = annotatePromise(
      importWithRetry(loader).then(({ default: impl }) => {
        // Warm this family's modal chunks so the first open is instant.
        if (impl.modalsToPreload) preloadCoinModals(impl.modalsToPreload);
        return impl;
      }),
    );
  }
  return familyPromiseCache[name] as Promise<LLDCoinFamily<A, T, TS, O>>;
}

// Invalidate a cached family so the next call retries (e.g. after a persistent load failure).
export function clearLLDCoinFamilyCache(name: string): void {
  delete familyPromiseCache[name];
}
