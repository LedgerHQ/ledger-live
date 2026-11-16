import { getEnv } from "@shared/env";
import { ledgerClientVersion } from "./client-version";
import type { CryptoAssetsStore } from "@features/platform-currencies/legacy";

export const calApiConfig = { calServiceUrl: getEnv("CAL_SERVICE_URL"), ledgerClientVersion };

export function withCalServiceUrlOnFailure(
  store: CryptoAssetsStore,
  calServiceUrl: string,
): CryptoAssetsStore {
  const tagWithUrl = (error: unknown): never => {
    if (error instanceof Error && !("url" in error)) Object.assign(error, { url: calServiceUrl });
    throw error;
  };
  return {
    findTokenById: id => store.findTokenById(id).catch(tagWithUrl),
    findTokenByAddressInCurrency: (address, currencyId, tokenIdentifier) =>
      store.findTokenByAddressInCurrency(address, currencyId, tokenIdentifier).catch(tagWithUrl),
    getTokensSyncHash: currencyId => store.getTokensSyncHash(currencyId).catch(tagWithUrl),
  };
}
