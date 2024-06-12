import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";

import { Order } from "~/renderer/screens/dashboard/MarketPerformanceWidget/types";

export function getSlicedList(list: MarketItemPerformer[], order: Order, range: PortfolioRange) {
  return list.filter(elem =>
    order === Order.asc
      ? getChangePercentage(elem, range) > 0
      : getChangePercentage(elem, range) < 0,
  );
}

export function getChangePercentage(data: MarketItemPerformer, range: PortfolioRange) {
  switch (range) {
    case "day":
      return data.priceChangePercentage24h;
    case "week":
      return data.priceChangePercentage7d;
    case "month":
      return data.priceChangePercentage30d;
    case "year":
    default:
      return data.priceChangePercentage1y;
  }
}
