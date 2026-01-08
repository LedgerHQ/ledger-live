import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";

export const getChangePercentage = (data: MarketItemPerformer, range: PortfolioRange): number => {
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
};
