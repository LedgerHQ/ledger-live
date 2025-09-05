import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type AddTokens = (tokens: TokenCurrency[]) => void;

// Resolves an addTokens function from a CryptoAssetsStore getter, if available
// Returns null if the store is not set yet or does not support dynamic additions
export function resolveTokenAdder(getStore: () => CryptoAssetsStore): AddTokens | null {
  try {
    const store = getStore();
    return store?.addTokens?.bind(store) || null;
  } catch (_) {
    // store not set yet
  }
  return null;
}
