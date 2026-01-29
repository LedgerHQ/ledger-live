import { PortfolioRange } from "@ledgerhq/types-live";

enum Order {
  asc = "asc",
  desc = "desc",
}
export const MARKET_BANNER_TOP = 100;
export const MARKET_PERFORMERS_SUPPORTED = true;
export const MARKET_BANNER_DATA_SORT_ORDER = Order.asc;
export const TIME_RANGE: PortfolioRange = "day";
