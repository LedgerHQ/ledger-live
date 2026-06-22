import React, { useEffect } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/index";
import { useDispatch, useSelector } from "~/context/hooks";
import { selectMarketBannerRanking, setMarketBannerRanking } from "~/reducers/marketBanner";
import { starredMarketCoinsSelector } from "~/reducers/settings";
import useMarketBannerViewModel from "./hooks/useMarketBannerViewModel";
import { usePerformersBannerItems, useFavoritesBannerItems } from "./hooks/useMarketBannerData";
import MarketBannerView from "./components/MarketBannerView";
import { MarketBannerProps } from "./types";
import { DEFAULT_RANKING_WITHOUT_DISCOVERABILITY } from "./constants";
import type { MarketBannerRanking } from "~/reducers/types";

type MarketBannerSurfaceProps = MarketBannerProps & {
  items: MarketItemPerformer[];
  isError: boolean;
};

const MarketBannerSurface = ({ items, isError, testID }: MarketBannerSurfaceProps) => {
  const { range, showFilter, bannerFilter, onTilePress, onViewAllPress, onSectionTitlePress } =
    useMarketBannerViewModel();

  return (
    <MarketBannerView
      items={items}
      isError={isError}
      range={range}
      showFilter={showFilter}
      bannerFilter={bannerFilter}
      onTilePress={onTilePress}
      onViewAllPress={onViewAllPress}
      onSectionTitlePress={onSectionTitlePress}
      testID={testID}
    />
  );
};

const PerformersBanner = ({
  ranking,
  testID,
}: { ranking: MarketBannerRanking } & MarketBannerProps) => {
  const { items, isError } = usePerformersBannerItems(ranking);
  return <MarketBannerSurface items={items} isError={isError} testID={testID} />;
};

const FavoritesBanner = ({ testID }: MarketBannerProps) => {
  const { items, isError } = useFavoritesBannerItems();
  return <MarketBannerSurface items={items} isError={isError} testID={testID} />;
};

const MarketBannerContent = ({ testID }: MarketBannerProps) => {
  const dispatch = useDispatch();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
  const persistedRanking = useSelector(selectMarketBannerRanking);
  const hasStarred = useSelector(starredMarketCoinsSelector).length > 0;

  const ranking = shouldDisplayAssetDiscoverability
    ? persistedRanking
    : DEFAULT_RANKING_WITHOUT_DISCOVERABILITY;

  useEffect(() => {
    if (ranking === "favorites" && !hasStarred) {
      dispatch(setMarketBannerRanking("trending"));
    }
  }, [dispatch, ranking, hasStarred]);

  return ranking === "favorites" && hasStarred ? (
    <FavoritesBanner testID={testID} />
  ) : (
    <PerformersBanner ranking={ranking} testID={testID} />
  );
};

const MarketBanner = ({ testID }: MarketBannerProps) => {
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  // Gate before any data hook so a disabled banner does no work.
  if (!shouldDisplayMarketBanner) {
    return null;
  }

  return <MarketBannerContent testID={testID} />;
};

export default React.memo(MarketBanner);
