import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrencyPortfolio } from "~/renderer/actions/portfolio";

export function useTrendCellViewModel(currency: CryptoCurrency | TokenCurrency) {
  const { countervalueChange } = useCurrencyPortfolio({ currency, range: "day" });
  const percentage = countervalueChange.percentage;

  if (percentage == null) {
    return { formattedTrend: "-", colorClass: "text-muted" };
  }

  const sign = percentage > 0 ? "+" : "";
  const formattedTrend = `${sign}${(percentage * 100).toFixed(2)}%`;
  const colorClass = percentage >= 0 ? "text-success" : "text-error";

  return { formattedTrend, colorClass };
}
