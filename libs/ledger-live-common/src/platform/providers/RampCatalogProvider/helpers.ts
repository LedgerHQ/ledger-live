import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import { CurrenciesPerProvider, RampCatalog } from "./types";
import { CryptoCurrency } from "@ledgerhq/wallet-api-core/lib/currencies/types";

/** Flatten all providers' currencies into a single array */
export function getCryptoCurrencyIds(entries: CurrenciesPerProvider): Array<string> | null {
  if (!entries || isEmpty(entries)) {
    return null;
  }
  return uniq(Object.values(entries).flat());
}

export function isCurrencyInCatalog(
  currencyId: string | CryptoCurrency["id"],
  catalog: RampCatalog,
  status: "onRamp" | "offRamp",
) {
  if (!catalog || isEmpty(catalog[status])) {
    return false;
  }
  const currencies = getCryptoCurrencyIds(catalog[status]);

  return !currencies ? false : currencies.includes(currencyId);
}

/** Get the array of providers in the catalog that support the given currency */
export function getRampServiceProviders(
  currencyId: string | CryptoCurrency["id"],
  catalog: RampCatalog["onRamp"] | RampCatalog["offRamp"],
) {
  if (!catalog || isEmpty(catalog)) {
    return null;
  }
  const providers = Object.keys(catalog).filter(provider => catalog[provider].includes(currencyId));

  return providers;
}
