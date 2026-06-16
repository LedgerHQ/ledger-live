import type { FiatCurrency } from "@domain/entity-currency-fiat";

/** Props the host wires from the `supportedFiats` slice and the CVS query. */
export interface CurrenciesToolProps {
  /** Resolved, OFAC-filtered supported fiats. */
  supportedFiats: FiatCurrency[];
  /** Whether the supported-fiats query is currently in flight. */
  isFetching: boolean;
  /** Human-readable error message, when the query failed. */
  error?: string;
  /** Re-triggers the supported-fiats query. */
  refetch: () => void;
}
