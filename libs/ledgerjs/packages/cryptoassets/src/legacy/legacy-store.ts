import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { tokensById, tokensByCurrencyAddress } from "./legacy-state";

// Local CryptoAssetsStore interface to avoid external dependency
interface CryptoAssetsStore {
  findTokenById(id: string): Promise<TokenCurrency | undefined>;
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined>;
}

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
