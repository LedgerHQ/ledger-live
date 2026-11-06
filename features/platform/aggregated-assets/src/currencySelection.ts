import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AssetsData, AssetsDataWithPagination } from "@domain/api-aggregated-assets";
import type { AggregatedAssetId } from "@domain/entity-aggregated-asset";

export function selectCurrencyForMetaId(
  metaCurrencyId: AggregatedAssetId,
  data: AssetsDataWithPagination,
): CryptoOrTokenCurrency | undefined {
  const meta = data.cryptoAssets[metaCurrencyId];
  const assetsIds = meta?.assetsIds;
  if (!assetsIds) return undefined;

  const metaTicker = meta.ticker?.toUpperCase();
  // A meta-currency id can equal a ledger currency id, so the two ids are compared as plain strings.
  const metaIdAsCurrencyId: string = metaCurrencyId;

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
    if (currency.id === metaIdAsCurrencyId && tickerMatches) return currency;
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
  const assetGroups = Object.values(data.cryptoAssets);
  const groupWithCurrency = assetGroups.find(group =>
    Object.values(group.assetsIds).includes(currencyId),
  );
  const assetGroup = groupWithCurrency ?? (assetGroups.length === 1 ? assetGroups[0] : undefined);
  if (!assetGroup) return [];

  const groupTicker = assetGroup.ticker?.toUpperCase();
  return Object.values(assetGroup.assetsIds).filter(id => {
    const currency = data.cryptoOrTokenCurrencies[id];
    const isUnrelatedNativeCoin =
      currency?.type === "CryptoCurrency" && currency.ticker?.toUpperCase() !== groupTicker;
    return !isUnrelatedNativeCoin;
  });
}
