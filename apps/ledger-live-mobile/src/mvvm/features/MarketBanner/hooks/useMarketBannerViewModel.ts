import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isMoodIndexAvailable } from "@features/flow-fear-and-greed";
import { TIME_RANGE } from "@ledgerhq/live-common/market/constants";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/index";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { PAGE_NAME, BANNER_NAME } from "../constants";
import { UseMarketBannerViewModelResult } from "../types";
import { useMarketBannerFilter } from "./useMarketBannerFilter";

/**
 * Shared market banner presentation logic (range, filter trigger, navigation/tracking
 * handlers). Data fetching lives in the ranking-specific item hooks so the favorites
 * data source (React Query) is only mounted when the favorites ranking is active.
 */
const useMarketBannerViewModel = (): UseMarketBannerViewModelResult => {
  const baseNavigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
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
    bannerFilter,
    moodIndexAvailable: isMoodIndexAvailable(getCountryLocale()),
    range: TIME_RANGE,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
  };
};

export default useMarketBannerViewModel;
