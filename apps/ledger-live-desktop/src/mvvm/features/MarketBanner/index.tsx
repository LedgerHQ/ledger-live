import React, { memo, useCallback } from "react";
import SkeletonList from "./components/SkeletonList";
import { useTranslation } from "react-i18next";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";
import { useMarketBannerViewModel } from "./hooks/useMarketBannerViewModel";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import GenericError from "./components/GenericError";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { TrendingAssetsList } from "./components/TrendingAssetsList";

type MarketBannerViewProps = {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly data: MarketItemPerformer[] | undefined;
};

const MarketBannerView = memo(function MarketBannerView({
  isLoading,
  isError,
  data,
}: MarketBannerViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToMarket = useCallback(() => {
    navigate("/market");
  }, [navigate]);

  let content: React.ReactNode = null;
  if (isLoading) {
    content = <SkeletonList />;
  } else if (isError) {
    content = <GenericError />;
  } else if (data && data.length > 0) {
    content = <TrendingAssetsList items={data} />;
  }

  return (
    <div className="flex flex-col gap-12">
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
});

const MarketBanner = () => {
  const { isLoading, isError, data } = useMarketBannerViewModel();

  return <MarketBannerView isLoading={isLoading} isError={isError} data={data} />;
};

export { MarketBannerView };
export default MarketBanner;
