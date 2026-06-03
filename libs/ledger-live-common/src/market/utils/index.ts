import { PortfolioRange } from "@ledgerhq/types-live";
import { MarketItemPerformer, Order } from "./types";

// Export all types from types.ts
export * from "./types";

// Export fixtures for testing
export * from "./fixtures";

export type IsCurrencyAvailable = (currencyId: string, mode: "onRamp" | "offRamp") => boolean;

/**
 * Check if a currency is available for trading (buy/sell/swap)
 */
export function isAvailableForTrading(
  id: string,
  ledgerIds: string[],
  isCurrencyAvailable: IsCurrencyAvailable,
  currenciesForSwapAllSet: Set<string>,
): boolean {
  const canBuy = isCurrencyAvailable(id, "onRamp");
  const canSwap = currenciesForSwapAllSet.has(id);
  const canBuyOrSwapViaLedgerIds = ledgerIds.some(
    lrId => isCurrencyAvailable(lrId, "onRamp") || currenciesForSwapAllSet.has(lrId),
  );

  return canBuy || canSwap || canBuyOrSwapViaLedgerIds;
}

/**
 * Filter market performers by availability for trading, with fallback to original list
 */
export function filterMarketPerformersByAvailability(
  data: MarketItemPerformer[],
  isCurrencyAvailable: IsCurrencyAvailable,
  currenciesForSwapAllSet: Set<string>,
  limit: number,
): MarketItemPerformer[] {
  const availableItems = data.filter(item =>
    isAvailableForTrading(item.id, item.ledgerIds, isCurrencyAvailable, currenciesForSwapAllSet),
  );

  // Fallback to original list if no items match
  if (availableItems.length === 0) {
    return data.slice(0, limit);
  }

  return availableItems.slice(0, limit);
}

export function getChangePercentage(data: MarketItemPerformer, range: PortfolioRange): number {
  switch (range) {
    case "day":
      return data.priceChangePercentage24h ?? 0;
    case "week":
      return data.priceChangePercentage7d ?? 0;
    case "month":
      return data.priceChangePercentage30d ?? 0;
    case "year":
    case "all":
    default:
      return data.priceChangePercentage1y ?? 0;
  }
}

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

export type ChartRangeSegment = "1h" | "1d" | "1w" | "1m" | "6m" | "1y" | "5y" | "all";

export function getChartRangeSegment(range: PortfolioRange | string): ChartRangeSegment {
  switch (range) {
    case "1h":
      return "1h";
    case "1d":
    case "24h":
    case "day":
      return "1d";
    case "1w":
    case "7d":
    case "week":
      return "1w";
    case "1m":
    case "30d":
    case "month":
      return "1m";
    case "6m":
      return "6m";
    case "1y":
    case "year":
      return "1y";
    case "5y":
      return "5y";
    case "all":
      return "all";
    default:
      return "1d";
  }
}

/** @FIXME workaround for main tokens & also until we have asset aggregation */
export function dadaIdToMarketId(id: string): string {
  if (!id.includes(":")) return id;
  const lastSegment = id.split(":").pop();
  return lastSegment?.replaceAll("_", "-") ?? id;
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
