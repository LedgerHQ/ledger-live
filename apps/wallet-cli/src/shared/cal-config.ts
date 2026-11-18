import { getEnv } from "@shared/env";
import { ledgerClientVersion } from "./client-version";
import type { CryptoAssetsStore } from "@features/platform-currencies/legacy";

export const calApiConfig = { calServiceUrl: getEnv("CAL_SERVICE_URL"), ledgerClientVersion };

// Errors of a request that got no answer or an HTTP error, as remapRtkQueryError names them. A
// schema or parsing error of a 2xx answer is the payload's fault, not the network's.
const REQUEST_FAILURE_NAMES = new Set(["NetworkDown", "LedgerAPI4xx", "LedgerAPI5xx"]);

export function withCalServiceUrlOnFailure(
  store: CryptoAssetsStore,
  calServiceUrl: string,
): CryptoAssetsStore {
  const tagWithUrl = (error: unknown): never => {
    if (error instanceof Error && REQUEST_FAILURE_NAMES.has(error.name) && !("url" in error)) {
      Object.assign(error, { url: calServiceUrl });
    }
    throw error;
  };
  return {
    findTokenById: id => store.findTokenById(id).catch(tagWithUrl),
    findTokenByAddressInCurrency: (address, currencyId, tokenIdentifier) =>
      store.findTokenByAddressInCurrency(address, currencyId, tokenIdentifier).catch(tagWithUrl),
    getTokensSyncHash: currencyId => store.getTokensSyncHash(currencyId).catch(tagWithUrl),
  };
}
