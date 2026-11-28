import { formatTrendPercent, getTrendTone, type TrendTone } from "@shared/trend";
import { useAssetsTablePorts } from "./assetsTablePorts";

const COLOR_CLASS_BY_TONE: Record<TrendTone, string> = {
  positive: "text-success",
  negative: "text-error",
  neutral: "text-muted",
};

export function useTrendCellViewModel(trend: number | null | undefined) {
  const { discreet } = useAssetsTablePorts();
  if (trend == null) {
    return { formattedTrend: "-", colorClass: "text-muted" };
  }

  const formattedTrend = discreet ? "***" : formatTrendPercent(trend * 100);
  const colorClass = COLOR_CLASS_BY_TONE[getTrendTone(trend)];

  return { formattedTrend, colorClass };
}
