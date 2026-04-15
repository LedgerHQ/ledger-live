import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";

export function useTrendCellViewModel(trend: number | null | undefined) {
  const discreet = useSelector(discreetModeSelector);
  if (trend == null) {
    return { formattedTrend: "-", colorClass: "text-muted" };
  }

  const sign = trend > 0 ? "+" : "";
  const formattedTrend = discreet ? "***" : `${sign}${(trend * 100).toFixed(2)}%`;
  const colorClass = trend >= 0 ? "text-success" : "text-error";

  return { formattedTrend, colorClass };
}
