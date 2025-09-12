import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { tokensById, tokensByCurrencyAddress } from "./legacy-state";

async function findTokenById(id: string): Promise<TokenCurrency | undefined> {
  return tokensById[id];
}

async function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): Promise<TokenCurrency | undefined> {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

export const legacyCryptoAssetsStore: CryptoAssetsStore = {
  findTokenById,
  findTokenByAddressInCurrency,
};
