import { useState, useEffect } from "react";

/**
 * Factory that creates a typed React hook for a single family slot.
 * Each hook loads the slot module for the given family on first use
 * via dynamic import(), caching the result so subsequent renders are free.
 *
 * Returns undefined synchronously on first render (same as the existing
 * "family not in registry" fallback), then re-renders once the module resolves.
 */
export type FamilySlotHook<T> = {
  (family: string | undefined): T | undefined;
  /** Synchronous cache lookup — returns undefined if the family module hasn't loaded yet. */
  getCached(family: string | undefined): T | undefined;
  /** Triggers loading if not cached and resolves once the module is ready. Safe to call outside React render. */
  preload(family: string | undefined): Promise<T | undefined>;
};

export function createFamilySlotHook<T>(
  loaders: Map<string, () => Promise<{ default: T }>>,
): FamilySlotHook<T> {
  const cache = new Map<string, T>();
  const inFlight = new Map<string, Promise<T>>();

  function useFamilySlot(family: string | undefined): T | undefined {
    // Stores the async-loaded result paired with the family it was loaded for,
    // so stale results from a previous family are never returned.
    const [asyncResult, setAsyncResult] = useState<readonly [string, T] | undefined>(undefined);

    useEffect(() => {
      if (!family) return;
      // Already in cache — served synchronously below, no state update needed.
      if (cache.has(family)) return;
      let cancelled = false;
      let promise = inFlight.get(family);
      if (!promise) {
        const loader = loaders.get(family);
        if (!loader) return;
        promise = loader().then(({ default: impl }) => {
          cache.set(family, impl);
          inFlight.delete(family);
          return impl;
        });
        inFlight.set(family, promise);
      }
      promise.then(impl => {
        if (!cancelled) setAsyncResult([family, impl] as const);
      }).catch(() => {
        // Dynamic import failure: slot unavailable, component renders without it.
      });
      return () => {
        cancelled = true;
      };
    }, [family]);

    // Synchronous path: return cached value immediately without waiting for state.
    // This also prevents a spurious re-render when `family` changes to an already-loaded family.
    const cached = family ? cache.get(family) : undefined;
    if (cached !== undefined) return cached;

    // Async path: only use the async result if it matches the current family.
    return asyncResult !== undefined && asyncResult[0] === family ? asyncResult[1] : undefined;
  }

  useFamilySlot.getCached = (family: string | undefined): T | undefined =>
    family ? cache.get(family) : undefined;

  useFamilySlot.preload = (family: string | undefined): Promise<T | undefined> => {
    if (!family) return Promise.resolve(undefined);
    const cached = cache.get(family);
    if (cached !== undefined) return Promise.resolve(cached);
    let promise = inFlight.get(family);
    if (!promise) {
      const loader = loaders.get(family);
      if (!loader) return Promise.resolve(undefined);
      promise = loader().then(({ default: impl }) => {
        cache.set(family, impl);
        inFlight.delete(family);
        return impl;
      });
      inFlight.set(family, promise);
    }
    return promise;
  };

  return useFamilySlot;
}
