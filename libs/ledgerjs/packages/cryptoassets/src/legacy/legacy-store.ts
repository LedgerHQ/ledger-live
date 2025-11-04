import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { tokensById, tokensByCurrencyAddress, tokensByCryptoCurrency } from "./legacy-state";

function findTokenById(id: string): TokenCurrency | undefined {
  return tokensById[id];
}

function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): TokenCurrency | undefined {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

function getTokensSyncHash(currencyId: string): Promise<string> {
  const tokens = tokensByCryptoCurrency[currencyId];
  return Promise.resolve("legacy_" + tokens?.length);
}

/**
 * Legacy CryptoAssetsStore adapter that wraps the legacy token lookup functions
 * and provides the CryptoAssetsStore interface expected by the rest of the codebase.
 */
export const legacyCryptoAssetsStore: CryptoAssetsStore = {
  findTokenById,
  findTokenByAddressInCurrency,
  getTokensSyncHash,
};
