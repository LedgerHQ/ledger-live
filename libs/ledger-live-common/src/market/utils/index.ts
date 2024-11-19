import { PortfolioRange } from "@ledgerhq/types-live";
import { Order } from "./types";

export function getRange(range: PortfolioRange | string) {
  switch (range) {
    case "day":
    case "24h":
      return "1d";
    case "7d":
    case "week":
      return "1w";
    case "30d":
    case "month":
      return "1m";
    case "1y":
    case "year":
    case "all":
      return "1y";
  }
}

export const getSortParam = (order: Order, range: PortfolioRange | string) => {
  switch (order) {
    default:
    case Order.MarketCapDesc:
      return "market-cap-rank";
    case Order.MarketCapAsc:
      return "market-cap-rank-desc";
    case Order.topLosers:
      return `negative-price-change-${getRange(range)}`;
    case Order.topGainers:
      return `positive-price-change-${getRange(range)}`;
  }
};
