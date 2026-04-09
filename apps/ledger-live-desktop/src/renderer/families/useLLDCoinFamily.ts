import { useState, useEffect } from "react";
import type { Account, TransactionCommon, TransactionStatusCommon, Operation } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "./types";
import { getCachedLLDCoinFamily, importLLDCoinFamily } from "./registry";

/**
 * Hook that asynchronously loads and returns the LLD coin family implementation for a given
 * currency family name. Returns `{}` on first render (same as the "unknown family" fallback),
 * then re-renders with the loaded family once the dynamic import resolves.
 *
 * In Electron (loading from disk), the async gap is a few ms — practically invisible to users.
 */
export function useLLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatusCommon,
  O extends Operation,
>(name: string | undefined): LLDCoinFamily<A, T, TS, O> {
  const [family, setFamily] = useState<LLDCoinFamily<A, T, TS, O>>(
    () =>
      (name ? getCachedLLDCoinFamily<A, T, TS, O>(name) : null) ??
      ({} as LLDCoinFamily<A, T, TS, O>),
  );

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    importLLDCoinFamily<A, T, TS, O>(name).then(impl => {
      if (!cancelled) setFamily(impl);
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return family;
}
