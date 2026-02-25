import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";

export interface MarketBannerProps {
  testID?: string;
}

export interface MarketTileProps {
  item: MarketItemPerformer;
  index: number;
  range: PortfolioRange;
  onPress: (item: MarketItemPerformer) => void;
}

export interface ViewAllTileProps {
  onPress: () => void;
}

export interface SkeletonTileProps {
  index: number;
}

export interface UseMarketBannerViewModelResult {
  items: MarketItemPerformer[];
  isLoading: boolean;
  isError: boolean;
  isEnabled: boolean;
  range: PortfolioRange;
  onTilePress: (item: MarketItemPerformer) => void;
  onViewAllPress: () => void;
  onSectionTitlePress: () => void;
}
