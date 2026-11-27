import { track } from "@shared/analytics";
import { useCallback, useState } from "react";
import { useGetGlobalMarketDataQuery } from "@domain/api-market-index-global";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale, useTranslation } from "~/context/Locale";
import { counterValueFormatter } from "LLM/features/Market/utils";
import type { MarketCapCardViewModel } from "./types";

const BUTTON_NAME = "market_cap_definition";

/** Polling cadence of the market cap card: 3 minutes. */
const MARKET_CAP_REFRESH_INTERVAL_MS = 180_000;

function trackDefinitionPressed() {
  track("button_clicked", {
    button: BUTTON_NAME,
  });
}

export function useMarketCapCardViewModel(): MarketCapCardViewModel {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();

  const { data, isLoading, isError } = useGetGlobalMarketDataQuery(
    { counterCurrency: "usd" },
    { pollingInterval: MARKET_CAP_REFRESH_INTERVAL_MS },
  );
  const { rate, status: rateStatus } = useUsdToFiatRate(counterCurrency);

  const handleOpenDrawer = useCallback(() => {
    trackDefinitionPressed();
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);
  const marketCap = data && rate != null ? data.marketCap * rate : undefined;

  return {
    value: marketCap
      ? counterValueFormatter({
          currency: counterCurrency,
          value: marketCap,
          shorten: true,
          locale,
          t,
        })
      : "",
    changePercentage: data?.changePercentage24h,
    isLoading: isLoading || rateStatus === "loading",
    isError: isError || rateStatus === "error" || !data,
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
}
