import React, { useCallback } from "react";
import SkeletonList from "./components/SkeletonList";
import { useTranslation } from "react-i18next";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-react";
import { useHistory } from "react-router-dom";
import { useMarketBannerViewModel } from "./hooks/useMarketBannerViewModel";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

type MarketBannerViewProps = {
  readonly isLoading: boolean;
};

const MarketBannerView = ({ isLoading }: MarketBannerViewProps) => {
  const { t } = useTranslation();
  const history = useHistory();

  const goToMarket = useCallback(() => {
    history.push({
      pathname: `/market`,
    });
  }, [history]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-base heading-4-semi-bold">{t("marketBanner.title")}</span>
        <InteractiveIcon
          iconType="stroked"
          aria-label="Interactive icon"
          onClick={goToMarket}
          data-testid="market-banner-button"
        >
          <ChevronRight size={16} />
        </InteractiveIcon>
      </div>
      {isLoading ? <SkeletonList /> : null}
    </div>
  );
};

const MarketBanner = () => {
  const { isLoading } = useMarketBannerViewModel();

  return <MarketBannerView isLoading={isLoading} />;
};

export { MarketBannerView };
export default MarketBanner;
