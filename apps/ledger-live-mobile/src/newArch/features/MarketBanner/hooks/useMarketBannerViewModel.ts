import { useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { counterValueCurrencySelector, selectedTimeRangeSelector } from "~/reducers/settings";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import {
  MARKET_BANNER_TILE_COUNT,
  MARKET_BANNER_TOP,
  REFRESH_RATE,
  PAGE_NAME,
  BANNER_NAME,
} from "../constants";
import { UseMarketBannerViewModelResult } from "../types";

const useMarketBannerViewModel = (): UseMarketBannerViewModelResult => {
  const baseNavigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const marketNavigation = useNavigation<NavigationProp<WalletTabNavigatorStackParamList>>();
  const lwmWallet40 = useFeature("lwmWallet40");

  const isMarketBannerEnabled = lwmWallet40?.enabled && lwmWallet40?.params?.marketBanner;
  const timeRange = useSelector(selectedTimeRangeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();

  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll ?? []),
    [currenciesForSwapAll],
  );

  const isAvailableToTrade = useCallback(
    (id: string, ledgerIds?: string[]): boolean => {
      const canBuy = isCurrencyAvailable(id, "onRamp");
      const canSwap = currenciesForSwapAllSet.has(id);
      const canBuyOrSwapViaLedgerIds =
        ledgerIds?.some(
          lrId => isCurrencyAvailable(lrId, "onRamp") || currenciesForSwapAllSet.has(lrId),
        ) ?? false;

      return canBuy || canSwap || canBuyOrSwapViaLedgerIds;
    },
    [currenciesForSwapAllSet, isCurrencyAvailable],
  );

  const { data, isLoading, isError } = useMarketPerformers({
    sort: "asc",
    counterCurrency: counterValueCurrency.ticker,
    range: timeRange,
    limit: MARKET_BANNER_TILE_COUNT * 2,
    top: MARKET_BANNER_TOP,
    supported: true,
    refreshRate: REFRESH_RATE,
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];

    const availableItems = data.filter(item => isAvailableToTrade(item.id, item.ledgerIds));

    if (availableItems.length === 0) {
      return data.slice(0, MARKET_BANNER_TILE_COUNT);
    }

    return availableItems.slice(0, MARKET_BANNER_TILE_COUNT);
  }, [data, isAvailableToTrade]);

  const navigateToMarket = useCallback(() => {
    marketNavigation.navigate(NavigatorName.Market, {
      screen: ScreenName.MarketList,
      params: {},
    });
  }, [marketNavigation]);

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
    isEnabled: isMarketBannerEnabled ?? false,
    range: timeRange,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
    onSwipe,
  };
};

export default useMarketBannerViewModel;
