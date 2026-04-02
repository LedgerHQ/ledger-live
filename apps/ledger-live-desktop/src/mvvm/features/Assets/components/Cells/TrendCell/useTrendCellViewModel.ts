import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "LLD/hooks/redux";
import { useCurrencyPortfolio } from "~/renderer/actions/portfolio";
import { discreetModeSelector } from "~/renderer/reducers/settings";

export function useTrendCellViewModel(currency: CryptoCurrency | TokenCurrency) {
  const { countervalueChange } = useCurrencyPortfolio({ currency, range: "day" });
  const discreet = useSelector(discreetModeSelector);
  const percentage = countervalueChange.percentage;

  if (percentage == null) {
    return { formattedTrend: "-", colorClass: "text-muted" };
  }

  const sign = percentage > 0 ? "+" : "";
  const formattedTrend = discreet ? "***" : `${sign}${(percentage * 100).toFixed(2)}%`;
  const colorClass = percentage >= 0 ? "text-success" : "text-error";

  return { formattedTrend, colorClass };
}
