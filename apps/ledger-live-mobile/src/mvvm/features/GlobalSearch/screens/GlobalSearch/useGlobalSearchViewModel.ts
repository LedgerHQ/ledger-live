import { useCallback, useEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { useGlobalSearchDefaults } from "LLM/features/GlobalSearch/hooks/useGlobalSearchDefaults";
import { useGlobalSearchResults } from "LLM/features/GlobalSearch/hooks/useGlobalSearchResults";
import type { GlobalSearchNavigatorParamList } from "LLM/features/GlobalSearch/types";
import type { GlobalSearchDefaultSections } from "./types";

export type GlobalSearchCategory = "crypto" | "stocks";

const SEARCH_FLOW = "global_search";

export type GlobalSearchViewModel = {
  search: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
  isLoadingDefaults: boolean;
  isLoadingSearch: boolean;
  hasNoResults: boolean;
  hasError: boolean;
  defaultSections: GlobalSearchDefaultSections;
  searchResults: MarketAssetDisplayData[];
  onBack: () => void;
  onSeeAll: (category: GlobalSearchCategory) => void;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onStockPress: (stock: StockSuggestion) => void;
};

export function useGlobalSearchViewModel(): GlobalSearchViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute<RouteProp<GlobalSearchNavigatorParamList, ScreenName.GlobalSearch>>();
  const source = route.params?.source;
  const { openFromMarket } = useAssetDetailNavigation();

  const {
    search,
    setSearch,
    clearSearch,
    isSearchActive,
    searchResults,
    isLoadingSearch,
    hasNoResults,
    hasError: hasSearchError,
  } = useGlobalSearchResults();
  const {
    defaultSections,
    isLoadingDefaults,
    hasError: hasDefaultsError,
  } = useGlobalSearchDefaults(!isSearchActive);

  const hasError = isSearchActive ? hasSearchError : hasDefaultsError;

  useEffect(() => {
    currentRouteNameRef.current = ScreenName.GlobalSearch;
    track("search_open", { page: ScreenName.GlobalSearch });
  }, []);

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSeeAll = useCallback(
    (category: GlobalSearchCategory) => {
      track("button_clicked", { button: "See all", page: ScreenName.GlobalSearch, category });

      navigation.navigate(ScreenName.MarketList, {
        category: category === "stocks" ? "stocks" : "all",
      });
    },
    [navigation],
  );

  const onAssetPress = useCallback(
    (asset: MarketAssetDisplayData) => {
      track("asset_clicked", {
        asset: asset.name,
        page: ScreenName.GlobalSearch,
        flow: SEARCH_FLOW,
        searched: isSearchActive,
        source,
      });
      openFromMarket({
        marketCurrencyId: asset.id,
        ledgerCurrencyIds: asset.ledgerIds,
        source: ScreenName.GlobalSearch,
      });
    },
    [openFromMarket, isSearchActive, source],
  );

  const onStockPress = useCallback(
    (stock: StockSuggestion) => {
      track("asset_clicked", {
        asset: stock.name,
        page: ScreenName.GlobalSearch,
        flow: SEARCH_FLOW,
        searched: false,
        source,
      });
      openFromMarket({
        marketCurrencyId: stock.navigationId,
        ledgerCurrencyIds: [stock.ledgerId],
        source: ScreenName.GlobalSearch,
      });
    },
    [openFromMarket, source],
  );

  return {
    search,
    setSearch,
    clearSearch,
    isSearchActive,
    isLoadingDefaults,
    isLoadingSearch,
    hasNoResults,
    hasError,
    defaultSections,
    searchResults,
    onBack,
    onSeeAll,
    onAssetPress,
    onStockPress,
  };
}
