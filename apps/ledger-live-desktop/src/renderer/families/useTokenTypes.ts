import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useLLDCoinFamily } from "~/renderer/families";

export function useTokenTypes(currency: CryptoCurrency | null | undefined): string[] {
  const { getTokenTypes } = useLLDCoinFamily(currency?.family);
  if (!currency) return [];

  return getTokenTypes?.(currency) ?? currency.tokenTypes ?? [];
}
