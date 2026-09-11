import type { PayCardCurrencyMappingRow } from "../../types";

export interface CurrencyMappingScreenProps {
  readonly rows: readonly PayCardCurrencyMappingRow[];
  readonly onBack: () => void;
}

/** Native-only for now, like the screens it sits next to. */
export function CurrencyMappingScreen(_props: CurrencyMappingScreenProps) {
  return null;
}
