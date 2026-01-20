import React, { memo, useCallback } from "react";
import SkeletonList from "./components/SkeletonList";
import { useNavigate } from "react-router";
import { useMarketBannerViewModel } from "./hooks/useMarketBannerViewModel";
import GenericError from "./components/GenericError";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { TrendingAssetsList } from "./components/TrendingAssetsList";
import { MarketBannerHeader } from "./components/MarketBannerHeader";

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
      <MarketBannerHeader onNavigate={goToMarket} />
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
