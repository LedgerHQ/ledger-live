import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetsDataWithPagination } from "../state-manager/types";

/**
 * Selects the best currency from asset data result based on priority:
 * 1. Main currency (matching metaCurrencyId)
 * 2. CryptoCurrency type
 * 3. First available network
 */
export function selectCurrency(
  result: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const metaCurrencyId = result.currenciesOrder.metaCurrencyIds?.[0];
  if (!metaCurrencyId) return undefined;

  const assetsIds = result.cryptoAssets[metaCurrencyId]?.assetsIds;
  if (!assetsIds) return undefined;

  let fallback: CryptoOrTokenCurrency | undefined;
  let crypto: CryptoOrTokenCurrency | undefined;

  for (const id of Object.values(assetsIds)) {
    const currency = result.cryptoOrTokenCurrencies[id];
    if (!currency) continue;

    if (currency.id === metaCurrencyId) return currency; // highest priority
    if (!fallback) fallback = currency;
    if (!crypto && currency.type === "CryptoCurrency") crypto = currency;
  }

  // CryptoCurrency > fallback (should be a TokenCurrency)
  return crypto ?? fallback;
}
