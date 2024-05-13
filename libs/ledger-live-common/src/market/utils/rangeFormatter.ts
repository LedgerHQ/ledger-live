import { PortfolioRange } from "@ledgerhq/types-live";

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
