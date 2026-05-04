import { use, useMemo } from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { getCurrencyBridge } from "./index";

// Temporary: pre-annotates a fulfilled Promise so React.use() returns synchronously today.
// Remove once getCurrencyBridge returns a Promise natively (LIVE-29176).
function makeSuspensePromise<T>(value: T): Promise<T> & { status: string; value: T } {
  const p = Promise.resolve(value) as Promise<T> & { status: string; value: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

export function useCurrencyBridge<T extends CurrencyBridge = CurrencyBridge>(
  currency: CryptoCurrency,
): T {
  const promise = useMemo(() => makeSuspensePromise(getCurrencyBridge(currency)), [currency]);
  return use(promise) as T;
}
