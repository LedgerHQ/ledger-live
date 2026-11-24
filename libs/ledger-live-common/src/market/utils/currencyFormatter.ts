import type { MarketItemPerformer, MarketItemResponse } from "./types";

export {
  formatMarketCurrency as format,
  formatMarketCurrencies as currencyFormatter,
} from "@domain/api-market-currency";

export const formatPerformer = (currency: MarketItemResponse): MarketItemPerformer => ({
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
});
