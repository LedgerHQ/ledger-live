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

/**
 * `true` once the first CVS query has settled (success or failure).
 * Use to distinguish fallback state from live CVS data.
 */
export function selectSupportedFiatsReady(state: { supportedFiats: SupportedFiatsState }): boolean {
  return state.supportedFiats.fiatsReady;
}
