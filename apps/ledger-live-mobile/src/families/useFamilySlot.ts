import { use } from "react";

/**
 * Factory that creates a typed hook for a single LLM family slot.
 *
 * The hook loads the slot module for the given family on first use via dynamic
 * import() and reads it with React's use(). The import promise is cached and
 * annotated (status/value/reason) per family so it is a stable reference that
 * resolves synchronously after settlement — use() therefore never re-suspends.
 *
 * This mirrors live-common's bridge cache (see bridge/impl.ts `annotatePromise`
 * + `useAccountBridge`). Passing `undefined` (or a family with no slot) is safe: it
 * returns undefined without loading or suspending. The hook itself follows the Rules
 * of Hooks — call it unconditionally and use the `family` argument to gate loading.
 *
 * Requires a <Suspense> boundary in the parent tree (same as useAccountBridge).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader<T> = () => Promise<{ default: T }>;

type AnnotatedPromise<T> = Promise<T> & {
  status?: "fulfilled" | "rejected";
  value?: T;
  reason?: unknown;
};

// Annotate a Promise with use()'s hint fields so it returns synchronously after
// settlement. Identical strategy to bridge/impl.ts in ledger-live-common.
function annotatePromise<T>(promise: Promise<T>): AnnotatedPromise<T> {
  const annotated = promise as AnnotatedPromise<T>;
  promise.then(
    value => {
      annotated.status = "fulfilled";
      annotated.value = value;
    },
    reason => {
      annotated.status = "rejected";
      annotated.reason = reason;
    },
  );
  return annotated;
}

export type FamilySlotHook<T> = {
  (family: string | undefined): T | undefined;
  /** Synchronous cache read: the loaded value if already settled, else undefined. Does not trigger a load. */
  getCached(family: string | undefined): T | undefined;
  /** Triggers/returns the cached load promise. Safe to call outside React render. */
  preload(family: string | undefined): Promise<T | undefined>;
};

export function createFamilySlotHook<T>(loaders: Map<string, Loader<T>>): FamilySlotHook<T> {
  // One cached, annotated promise per family — a stable reference across renders.
  const cache = new Map<string, AnnotatedPromise<T>>();

  const load = (family: string | undefined): AnnotatedPromise<T> | undefined => {
    if (!family) return undefined;
    const cached = cache.get(family);
    if (cached) return cached;
    const loader = loaders.get(family);
    if (!loader) return undefined;
    const promise = annotatePromise(loader().then(({ default: impl }) => impl));
    cache.set(family, promise);
    return promise;
  };

  function useFamilySlot(family: string | undefined): T | undefined {
    const promise = load(family);
    return promise ? use(promise) : undefined;
  }

  useFamilySlot.getCached = (family: string | undefined): T | undefined => {
    const cached = family ? cache.get(family) : undefined;
    return cached?.status === "fulfilled" ? cached.value : undefined;
  };

  useFamilySlot.preload = (family: string | undefined): Promise<T | undefined> =>
    load(family) ?? Promise.resolve(undefined);

  return useFamilySlot;
}
