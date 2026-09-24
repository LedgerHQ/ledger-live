import type { PayDebitOrderProperties } from "./types";

export function toPayDebitOrderProperties(
  currencies: readonly (string | null | undefined)[],
): PayDebitOrderProperties {
  const asset = (index: number) => currencies[index]?.toUpperCase() ?? null;

  return {
    asset1: asset(0),
    asset2: asset(1),
    asset3: asset(2),
    asset4: asset(3),
    asset5: asset(4),
  };
}
