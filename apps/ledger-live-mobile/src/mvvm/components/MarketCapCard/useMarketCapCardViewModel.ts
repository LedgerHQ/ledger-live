import { useCallback, useState } from "react";
import { useGlobalMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale, useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { counterValueFormatter } from "LLM/features/Market/utils";
import type { MarketCapCardViewModel } from "./types";

const BUTTON_NAME = "market_cap_definition";

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

  const { data, isLoading, isError } = useGlobalMarketData({ counterCurrency: "usd" });
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
