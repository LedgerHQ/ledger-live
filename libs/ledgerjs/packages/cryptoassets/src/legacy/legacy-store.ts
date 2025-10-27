import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { tokensById, tokensByCurrencyAddress, tokensByCryptoCurrency } from "./legacy-state";

async function findTokenById(id: string): Promise<TokenCurrency | undefined> {
  return tokensById[id];
}

async function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): Promise<TokenCurrency | undefined> {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

function getTokensSyncHash(currencyId: string): Promise<string> {
  const tokens = tokensByCryptoCurrency[currencyId];
  return Promise.resolve("legacy_" + tokens?.length);
}

export const legacyCryptoAssetsStore: CryptoAssetsStore = {
  findTokenById,
  findTokenByAddressInCurrency,
  getTokensSyncHash,
};
