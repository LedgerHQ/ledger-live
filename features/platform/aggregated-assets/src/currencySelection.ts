import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AssetsData, AssetsDataWithPagination } from "@domain/api-aggregated-assets";

export function selectCurrencyForMetaId(
  metaCurrencyId: string,
  data: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const meta = data.cryptoAssets[metaCurrencyId];
  const assetsIds = meta?.assetsIds;
  if (!assetsIds) return undefined;

  const metaTicker = meta.ticker?.toUpperCase();

  let fallback: CryptoOrTokenCurrency | undefined;
  let crypto: CryptoOrTokenCurrency | undefined;
  let token: CryptoOrTokenCurrency | undefined;

  for (const id of Object.values(assetsIds)) {
    const currency = data.cryptoOrTokenCurrencies[id];
    if (!currency) continue;

    const tickerMatches = currency.ticker?.toUpperCase() === metaTicker;

    // Require both id and ticker to match: some L2 chains share their ledger id with a
    // token meta-currency id but use a different native ticker (e.g. an L2 that uses ETH
    // as gas). Id alone would pick the chain when we actually want the token.
    if (currency.id === metaCurrencyId && tickerMatches) return currency;
    if (!fallback) fallback = currency;
    // Prefer chain coins over tokens when the ticker matches — the chain is the primary
    // form of the asset. Skip chains whose ticker differs: they are unrelated assets.
    if (!crypto && currency.type === "CryptoCurrency" && tickerMatches) crypto = currency;
    if (!token && currency.type === "TokenCurrency" && tickerMatches) token = currency;
  }

  return crypto ?? token ?? fallback;
}

export function selectCurrency(
  result: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const metaCurrencyId = result.currenciesOrder.metaCurrencyIds?.[0];
  if (!metaCurrencyId) return undefined;
  return selectCurrencyForMetaId(metaCurrencyId, result);
}

export function selectAssetCurrencyIds(data: AssetsData, currencyId: string): string[] {
  const groupWithCurrency = Object.values(data.cryptoAssets).find(group =>
    Object.values(group.assetsIds).includes(currencyId),
  );
  const firstMetaCurrencyId = data.currenciesOrder.metaCurrencyIds?.[0];
  const assetGroup =
    groupWithCurrency ?? (firstMetaCurrencyId ? data.cryptoAssets[firstMetaCurrencyId] : undefined);
  if (!assetGroup) return [];

  const groupTicker = assetGroup.ticker?.toUpperCase();
  return Object.values(assetGroup.assetsIds).filter(id => {
    const currency = data.cryptoOrTokenCurrencies[id];
    const isUnrelatedNativeCoin =
      currency?.type === "CryptoCurrency" && currency.ticker?.toUpperCase() !== groupTicker;
    return !isUnrelatedNativeCoin;
  });
}
