import type { FiatCurrency } from "@domain/entity-currency-fiat";
import type { WithSupportedFiats } from "./schema";

/**
 * Selects the resolved supported fiats.
 *
 * @param s Any store state containing the `supportedFiats` slice.
 */
export function selectSupportedFiats(s: WithSupportedFiats): FiatCurrency[] {
  return s.supportedFiats.currencies;
}
