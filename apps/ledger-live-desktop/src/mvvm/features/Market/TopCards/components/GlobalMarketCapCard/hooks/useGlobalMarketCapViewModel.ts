import { useSelector } from "LLD/hooks/redux";
import { useGetGlobalMarketDataQuery } from "@domain/api-market-index-global";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "@shared/analytics";

/** Polling cadence of the global market cap card: 3 minutes. */
const GLOBAL_MARKET_CAP_REFRESH_INTERVAL_MS = 180_000;

export const useGlobalMarketCapViewModel = () => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const locale = useSelector(localeSelector);

  // /v3/markets/global currently returns a USD-denominated market cap regardless of `to`.
  const { data, isLoading, isError } = useGetGlobalMarketDataQuery(
    { counterCurrency: "usd" },
    { pollingInterval: GLOBAL_MARKET_CAP_REFRESH_INTERVAL_MS },
  );
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
          unit: counterValueUnit,
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
