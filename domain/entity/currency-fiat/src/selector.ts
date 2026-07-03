import type { FiatCurrency } from "./schema";
import type { SupportedFiatsState } from "./types";

/**
 * Selects the current runtime-supported fiat currencies from the Redux store.
 */
export function selectSupportedFiats(state: {
  supportedFiats: SupportedFiatsState;
}): FiatCurrency[] {
  return state.supportedFiats.fiats;
}
