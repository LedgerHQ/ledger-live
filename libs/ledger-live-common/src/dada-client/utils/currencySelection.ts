import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetsDataWithPagination } from "../state-manager/types";

/**
 * Selects the best currency for a given meta-currency ID based on priority:
 * 1. Main currency (matching metaCurrencyId)
 * 2. CryptoCurrency type
 * 3. First available network
 */
export function selectCurrencyForMetaId(
  metaCurrencyId: string,
  data: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const assetsIds = data.cryptoAssets[metaCurrencyId]?.assetsIds;
  if (!assetsIds) return undefined;

  let fallback: CryptoOrTokenCurrency | undefined;
  let crypto: CryptoOrTokenCurrency | undefined;

  for (const id of Object.values(assetsIds)) {
    const currency = data.cryptoOrTokenCurrencies[id];
    if (!currency) continue;

    if (currency.id === metaCurrencyId) return currency;
    if (!fallback) fallback = currency;
    if (!crypto && currency.type === "CryptoCurrency") crypto = currency;
  }

  return crypto ?? fallback;
}

/**
 * Selects the best currency from the first meta-currency in the asset data result.
 */
export function selectCurrency(
  result: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const metaCurrencyId = result.currenciesOrder.metaCurrencyIds?.[0];
  if (!metaCurrencyId) return undefined;
  return selectCurrencyForMetaId(metaCurrencyId, result);
}
