import React, { useCallback } from "react";
import SkeletonList from "./components/SkeletonList";
import { useTranslation } from "react-i18next";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-react";
import { useHistory } from "react-router-dom";
import { useMarketBannerViewModel } from "./hooks/useMarketBannerViewModel";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import GenericError from "./components/GenericError";

type MarketBannerViewProps = {
  readonly isLoading: boolean;
  readonly isError: boolean;
};

const MarketBannerView = ({ isLoading, isError }: MarketBannerViewProps) => {
  const { t } = useTranslation();
  const history = useHistory();

  const goToMarket = useCallback(() => {
    history.push({
      pathname: `/market`,
    });
  }, [history]);

  let content: React.ReactNode = null;
  if (isLoading) {
    content = <SkeletonList />;
  } else if (isError) {
    content = <GenericError />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="heading-4-semi-bold text-base">{t("marketBanner.title")}</span>
        <InteractiveIcon
          iconType="stroked"
          aria-label="Interactive icon"
          onClick={goToMarket}
          data-testid="market-banner-button"
        >
          <ChevronRight size={16} />
        </InteractiveIcon>
      </div>
      {content}
    </div>
  );
};

const MarketBanner = () => {
  const { isLoading, isError } = useMarketBannerViewModel();

  return <MarketBannerView isLoading={isLoading} isError={isError} />;
};

export { MarketBannerView };
export default MarketBanner;
