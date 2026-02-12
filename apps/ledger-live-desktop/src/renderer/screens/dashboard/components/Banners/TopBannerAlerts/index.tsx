import React, { memo } from "react";
import { TopBannerContainer } from "../TopBannerContainer";
import ClearCacheBanner from "~/renderer/components/ClearCacheBanner";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import { currenciesSelector } from "~/renderer/reducers/accounts";
import { useSelector } from "LLD/hooks/redux";

/**
 * Renders the top banner alerts (clear cache, currency down status).
 * Only one alert is visible at a time via TopBannerContainer.
 */
export const TopBannerAlerts = memo(function TopBannerAlerts() {
  const currencies = useSelector(currenciesSelector);

  return (
    <TopBannerContainer>
      <ClearCacheBanner />
      <CurrencyDownStatusAlert currencies={currencies} hideStatusIncidents />
    </TopBannerContainer>
  );
});
