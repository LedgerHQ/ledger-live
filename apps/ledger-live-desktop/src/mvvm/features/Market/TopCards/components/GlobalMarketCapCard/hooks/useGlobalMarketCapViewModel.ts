import { useSelector } from "LLD/hooks/redux";
import { useGlobalMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";

export const useGlobalMarketCapViewModel = () => {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  const { data, isLoading, isError } = useGlobalMarketData({ counterCurrency });

  const onClick = () => {
    track("button_clicked", {
      button: "market_cap",
    });
  };

  return {
    value: data
      ? counterValueFormatter({
          currency: counterCurrency.toUpperCase(),
          value: data.marketCap,
          shorten: true,
          locale,
        })
      : "",
    changePercentage: data?.changePercentage24h,
    isLoading,
    isError: isError || !data,
    onClick,
  };
};
