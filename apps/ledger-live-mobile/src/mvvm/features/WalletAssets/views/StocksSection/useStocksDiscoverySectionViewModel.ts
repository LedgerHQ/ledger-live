import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { useAnalytics } from "~/analytics";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { useDefaultStocksAssets } from "LLM/hooks/useDefaultStocksAssets";
import { MAX_DISCOVERY_STOCKS } from "LLM/features/WalletAssets/constants";

export interface StocksDiscoverySectionViewModelResult {
  stocks: StockSuggestion[];
  isLoading: boolean;
  isError: boolean;
  onPressExploreAll: () => void;
  onItemPress: (stock: StockSuggestion) => void;
}

export function useStocksDiscoverySectionViewModel(): StocksDiscoverySectionViewModelResult {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { track } = useAnalytics();
  const { openFromMarket } = useAssetDetailNavigation();
  const { stocks, isLoading, isError } = useDefaultStocksAssets(true, MAX_DISCOVERY_STOCKS);

  const onPressExploreAll = useCallback(() => {
    track("button_clicked", { button: "explore_all", type: "stocks", page: "Wallet" });
    navigation.navigate(ScreenName.MarketList, { category: "stocks" });
  }, [navigation, track]);

  const onItemPress = useCallback(
    (stock: StockSuggestion) => {
      track("asset_clicked", { asset: stock.name, page: "Wallet" });
      openFromMarket({
        marketCurrencyId: stock.navigationId,
        ledgerCurrencyIds: [stock.ledgerId],
        source: "portfolio",
      });
    },
    [openFromMarket, track],
  );

  return { stocks, isLoading, isError, onPressExploreAll, onItemPress };
}
