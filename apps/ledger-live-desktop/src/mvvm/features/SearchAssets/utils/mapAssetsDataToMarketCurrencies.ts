import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { buildSearchMarketCurrencyData } from "./buildSearchMarketCurrencyData";

/** DADA prices are USD-denominated; `usdToFiatRate` converts them into the counter currency (1 = no-op). */
export function mapAssetsDataToMarketCurrencies(
  data: AssetsDataWithPagination | undefined,
  usdToFiatRate = 1,
): MarketCurrencyData[] {
  if (!data) return [];
  const { cryptoAssets, markets, currenciesOrder } = data;

  return currenciesOrder.metaCurrencyIds.flatMap(id => {
    const meta = cryptoAssets[id];
    if (!meta) return [];

    const currency = selectCurrencyForMetaId(id, data);
    const ledgerId = currency?.id ?? Object.values(meta.assetsIds)[0];
    if (!ledgerId) return [];
    const market = currency ? markets[currency.id] : undefined;

    return [
      applyUsdRateToMarket(
        buildSearchMarketCurrencyData({
          id: dadaIdToMarketId(market?.id ?? meta.id),
          name: meta.name,
          ticker: meta.ticker,
          ledgerIds: [ledgerId],
          image: market?.image,
          price: market?.price ?? 0,
          priceChangePercentage24h: market?.priceChangePercentage24h,
        }),
        usdToFiatRate,
      ),
    ];
  });
}
