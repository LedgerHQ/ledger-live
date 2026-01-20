import { useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import {
  MarketItemPerformer,
  filterMarketPerformersByAvailability,
} from "@ledgerhq/live-common/market/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  MARKET_BANNER_TILE_COUNT,
  MARKET_BANNER_TOP,
  REFRESH_RATE,
  PAGE_NAME,
  BANNER_NAME,
} from "../constants";
import { UseMarketBannerViewModelResult } from "../types";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

const TIME_RANGE = "day";

const useMarketBannerViewModel = (): UseMarketBannerViewModelResult => {
  const baseNavigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();

  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll ?? []),
    [currenciesForSwapAll],
  );

  const { data, isLoading, isError } = useMarketPerformers({
    sort: "asc",
    counterCurrency: counterValueCurrency.ticker,
    range: TIME_RANGE,
    limit: MARKET_BANNER_TILE_COUNT * 2,
    top: MARKET_BANNER_TOP,
    supported: true,
    refreshRate: REFRESH_RATE,
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];

    return filterMarketPerformersByAvailability(
      data,
      isCurrencyAvailable,
      currenciesForSwapAllSet,
      MARKET_BANNER_TILE_COUNT,
    );
  }, [data, isCurrencyAvailable, currenciesForSwapAllSet]);

  const navigateToMarket = useCallback(() => {
    baseNavigation.navigate(ScreenName.MarketList);
  }, [baseNavigation]);

  const navigateToMarketDetail = useCallback(
    (currencyId: string) => {
      baseNavigation.navigate(ScreenName.MarketDetail, { currencyId });
    },
    [baseNavigation],
  );

  const onTilePress = useCallback(
    (item: MarketItemPerformer) => {
      track("button_clicked", {
        button: "Market Tile",
        page: PAGE_NAME,
        coin: item.name,
        banner: BANNER_NAME,
      });
      navigateToMarketDetail(item.id);
    },
    [navigateToMarketDetail],
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

  const onSwipe = useCallback(() => {
    track("swipe", {
      page: PAGE_NAME,
      banner: BANNER_NAME,
    });
  }, []);

  return {
    items: filteredItems,
    isLoading,
    isError,
    isEnabled: shouldDisplayMarketBanner,
    range: TIME_RANGE,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
    onSwipe,
  };
};

export default useMarketBannerViewModel;
