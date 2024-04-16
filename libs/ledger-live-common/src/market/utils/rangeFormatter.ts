import { PortfolioRange } from "@ledgerhq/types-live";

export function getRange(range: PortfolioRange) {
  switch (range) {
    case "day":
      return "1d";
    case "week":
      return "1w";
    case "month":
      return "1m";
    case "year":
    case "all":
      return "1y";
  }
}
