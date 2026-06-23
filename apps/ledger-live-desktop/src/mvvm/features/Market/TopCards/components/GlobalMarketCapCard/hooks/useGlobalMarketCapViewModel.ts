import { useSelector } from "LLD/hooks/redux";
import { useGlobalMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";

export const useGlobalMarketCapViewModel = () => {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  // /v3/markets/global currently returns a USD-denominated market cap regardless of `to`.
  const { data, isLoading, isError } = useGlobalMarketData({ counterCurrency: "usd" });
  const { rate, status: rateStatus } = useUsdToFiatRate(counterCurrency);

  const onClick = () => {
    track("button_clicked", {
      button: "market_cap_definition",
    });
  };
  const marketCap = data && rate != null ? data.marketCap * rate : undefined;

  return {
    value: marketCap
      ? counterValueFormatter({
          currency: counterCurrency.toUpperCase(),
          value: marketCap,
          shorten: true,
          locale,
        })
      : "",
    changePercentage: data?.changePercentage24h,
    isLoading: isLoading || rateStatus === "loading",
    isError: isError || rateStatus === "error" || !data,
    onClick,
  };
};
