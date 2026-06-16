import type { FiatCurrency } from "@domain/entity-currency-fiat";

/** Redux state holding the supported fiats resolved from the Countervalues Service. */
export interface SupportedFiatsState {
  /** Resolved, OFAC-filtered list of supported fiat currencies. */
  supportedFiats: FiatCurrency[];
}

/** Shape of any store state that includes the `supportedFiats` slice. */
export type WithSupportedFiats = { supportedFiats: SupportedFiatsState };

/** Initial state: empty until the CVS `getSupportedFiats` query resolves. */
export const SUPPORTED_FIATS_INITIAL_STATE: SupportedFiatsState = {
  supportedFiats: [],
};
