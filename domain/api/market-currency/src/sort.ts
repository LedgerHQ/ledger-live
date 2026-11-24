import { Order } from "@domain/entity-market-currency";

/**
 * The URL segment of a price-change window, e.g. `24h` or `day` → `1d`. Unknown ranges have no
 * segment.
 */
export function getRange(range: string): string | undefined {
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
    case "6m":
      return "6m";
    case "1y":
    case "year":
    case "all":
      return "1y";
    default:
      return undefined;
  }
}

/** The `sort` query param of `/v3/markets` for an order and a price-change range. */
export function getSortParam(order: Order, range: string): string {
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
    case Order.VolumeDesc:
      return "total-volume-desc";
    case Order.VolumeAsc:
      return "total-volume";
  }
}
