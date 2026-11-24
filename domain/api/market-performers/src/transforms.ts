import type { MarketItemResponse } from "@domain/api-market-currency";
import type { MarketItemPerformer } from "@domain/entity-market-performers";

/** Maps a raw `/v3/markets` item to the performer shown in the Market performers lists. */
export function formatMarketPerformer(currency: MarketItemResponse): MarketItemPerformer {
  return {
    id: currency.id,
    ledgerIds: currency.ledgerIds,
    name: currency.name,
    image: currency.image,
    ticker: currency.ticker,
    priceChangePercentage1h: currency.priceChangePercentage1h,
    priceChangePercentage24h: currency.priceChangePercentage24h,
    priceChangePercentage7d: currency.priceChangePercentage7d,
    priceChangePercentage30d: currency.priceChangePercentage30d,
    priceChangePercentage1y: currency.priceChangePercentage1y,
    price: currency.price,
  };
}
