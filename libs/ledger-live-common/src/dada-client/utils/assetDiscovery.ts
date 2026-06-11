import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { PartialMarketItemResponse } from "../../market/utils/types";
import { dadaIdToMarketId } from "../../market/utils/index";
import type { CryptoAssetMeta } from "../entities/index";
import type { AssetsDataWithPagination } from "../state-manager/types";
import { selectCurrencyForMetaId } from "./currencySelection";

/**
 * A stock entry derived from DADA asset data, ready to render as a pill/row.
 * Shared by the desktop and mobile asset-discovery surfaces (Global Search,
 * portfolio stocks section).
 */
export type StockSuggestion = {
  /** DADA meta-currency id — stable key. */
  id: string;
  name: string;
  ticker: string;
  /** Market id used for asset-detail navigation. */
  navigationId: string;
  /** Underlying ledger currency id (first network), for the crypto icon. */
  ledgerId: string;
};

/**
 * A categorized crypto/stablecoin entry: the raw DADA pieces an app needs to
 * build its own display model (price, market cap, icon…).
 */
export type CategorizedDiscoveryAsset = {
  metaId: string;
  meta: CryptoAssetMeta;
  currency: CryptoOrTokenCurrency;
  market?: PartialMarketItemResponse;
};

export type CategorizedDiscoveryAssets = {
  cryptos: CategorizedDiscoveryAsset[];
  stablecoins: CategorizedDiscoveryAsset[];
};

/**
 * Picks the top `limit` stocks from DADA asset data, preserving the API's
 * market-cap ordering.
 */
export function selectTopStocks(data: AssetsDataWithPagination, limit: number): StockSuggestion[] {
  const stocks: StockSuggestion[] = [];

  for (const metaId of data.currenciesOrder.metaCurrencyIds) {
    if (stocks.length >= limit) break;

    const meta = data.cryptoAssets[metaId];
    if (!meta) continue;

    const currency = selectCurrencyForMetaId(metaId, data);
    const ledgerId = currency?.id ?? Object.values(meta.assetsIds)[0];
    if (!ledgerId) continue;

    const market = currency ? data.markets[currency.id] : undefined;
    stocks.push({
      id: meta.id,
      name: meta.name,
      ticker: meta.ticker,
      navigationId: dadaIdToMarketId(market?.id ?? meta.id),
      ledgerId,
    });
  }

  return stocks;
}

/**
 * Walks the market-cap-ordered DADA list once and splits it into the top
 * `maxCryptos` cryptos and top `maxStablecoins` stablecoins, classifying each
 * asset by its ticker against `stablecoinTickers` (expected uppercase).
 */
export function selectTopAssetsByCategory(
  data: AssetsDataWithPagination,
  stablecoinTickers: Set<string>,
  { maxCryptos, maxStablecoins }: { maxCryptos: number; maxStablecoins: number },
): CategorizedDiscoveryAssets {
  const cryptos: CategorizedDiscoveryAsset[] = [];
  const stablecoins: CategorizedDiscoveryAsset[] = [];

  for (const metaId of data.currenciesOrder.metaCurrencyIds) {
    if (cryptos.length >= maxCryptos && stablecoins.length >= maxStablecoins) break;

    const meta = data.cryptoAssets[metaId];
    if (!meta) continue;

    const currency = selectCurrencyForMetaId(metaId, data);
    if (!currency) continue;

    const entry: CategorizedDiscoveryAsset = {
      metaId,
      meta,
      currency,
      market: data.markets[currency.id],
    };

    if (stablecoinTickers.has(meta.ticker?.toUpperCase() ?? "")) {
      if (stablecoins.length < maxStablecoins) stablecoins.push(entry);
    } else if (cryptos.length < maxCryptos) {
      cryptos.push(entry);
    }
  }

  return { cryptos, stablecoins };
}
