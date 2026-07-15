import type { FiatCurrency } from "./schema";

/** Redux state slice holding the runtime-supported fiat currencies. */
export type SupportedFiatsState = {
  fiats: FiatCurrency[];
};
