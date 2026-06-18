import type { FiatCurrency } from "@domain/entity-currency-fiat";

/** Finite state of the supported-fiats query. */
export type RemoteFiatStatus =
  | { type: "idle" }
  | { type: "fetching" }
  | { type: "error"; message: string };

/** Props the host wires from the `supportedFiats` slice and the CVS query. */
export interface CurrenciesToolProps {
  /** Resolved, OFAC-filtered supported fiats. */
  supportedFiats: FiatCurrency[];
  /** Finite status of the supported-fiats query. */
  status: RemoteFiatStatus;
  /** Re-triggers the supported-fiats query. */
  refetch: () => void;
}
