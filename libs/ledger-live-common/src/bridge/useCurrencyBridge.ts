import { use } from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { getCurrencyBridge } from "./index";

export function useCurrencyBridge<T extends CurrencyBridge = CurrencyBridge>(
  currency: CryptoCurrency,
): T {
  return use(getCurrencyBridge(currency) as Promise<T>);
}
