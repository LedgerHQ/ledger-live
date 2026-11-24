/** The segment the chart path expects: `/v3/markets/chart/{segment}/{id}`. */
export type ChartRangeSegment = "1h" | "1d" | "1w" | "1m" | "6m" | "1y" | "5y" | "all";

/** Maps a UI range to the URL segment. Unknown values fall back to one day, as the legacy client did. */
export function getChartRangeSegment(range: string): ChartRangeSegment {
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
