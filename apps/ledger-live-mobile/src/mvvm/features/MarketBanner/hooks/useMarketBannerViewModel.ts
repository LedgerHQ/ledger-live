import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/index";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { PAGE_NAME, BANNER_NAME } from "../constants";
import { UseMarketBannerViewModelResult } from "../types";
import { useMarketBannerFilter } from "./useMarketBannerFilter";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { TIME_RANGE } from "@ledgerhq/live-common/market/constants";

/**
 * Shared market banner presentation logic (range, filter trigger, navigation/tracking
 * handlers). Data fetching lives in the ranking-specific item hooks so the favorites
 * data source (React Query) is only mounted when the favorites ranking is active.
 */
const useMarketBannerViewModel = (): UseMarketBannerViewModelResult => {
  const baseNavigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
  const { openFromMarket } = useAssetDetailNavigation();
  const bannerFilter = useMarketBannerFilter();

  const navigateToMarket = useCallback(() => {
    baseNavigation.navigate(ScreenName.MarketList);
  }, [baseNavigation]);

  const onTilePress = useCallback(
    (item: MarketItemPerformer) => {
      track("button_clicked", {
        button: "Market Tile",
        page: PAGE_NAME,
        coin: item.name,
        banner: BANNER_NAME,
      });
      openFromMarket({
        marketCurrencyId: item.id,
        ledgerCurrencyIds: item.ledgerIds,
        source: "market_banner",
      });
    },
    [openFromMarket],
  );

  const onViewAllPress = useCallback(() => {
    track("button_clicked", {
      button: "View All",
      page: PAGE_NAME,
      banner: BANNER_NAME,
    });
    navigateToMarket();
  }, [navigateToMarket]);

  const onSectionTitlePress = useCallback(() => {
    track("button_clicked", {
      button: "Section Title",
      page: PAGE_NAME,
      banner: BANNER_NAME,
    });
    navigateToMarket();
  }, [navigateToMarket]);

  return {
    showFilter: shouldDisplayAssetDiscoverability,
    bannerFilter,
    range: TIME_RANGE,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
  };
};

export default useMarketBannerViewModel;
