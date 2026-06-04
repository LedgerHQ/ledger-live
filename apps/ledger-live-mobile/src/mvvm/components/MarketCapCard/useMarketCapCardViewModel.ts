import { useCallback, useState } from "react";
import { useGlobalMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
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

  const { data, isLoading, isError } = useGlobalMarketData({ counterCurrency });

  const handleOpenDrawer = useCallback(() => {
    trackDefinitionPressed();
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    value: data
      ? counterValueFormatter({
          currency: counterCurrency,
          value: data.marketCap,
          shorten: true,
          locale,
          t,
        })
      : "",
    changePercentage: data?.changePercentage24h,
    isLoading,
    isError: isError || !data,
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
}
