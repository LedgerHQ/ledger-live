import { useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { useGlobalSearchDefaults } from "./useGlobalSearchDefaults";
import { useGlobalSearchResults } from "./useGlobalSearchResults";
import type { GlobalSearchDefaultSections } from "./types";

export type GlobalSearchCategory = "crypto" | "stable" | "stocks";

export type GlobalSearchViewModel = {
  search: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
  isLoadingDefaults: boolean;
  isLoadingSearch: boolean;
  hasNoResults: boolean;
  defaultSections: GlobalSearchDefaultSections;
  searchResults: MarketAssetDisplayData[];
  onBack: () => void;
  onSeeAll: (category: GlobalSearchCategory) => void;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onStockPress: (stock: StockSuggestion) => void;
};

export function useGlobalSearchViewModel(): GlobalSearchViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openFromMarket } = useAssetDetailNavigation();

  const {
    search,
    setSearch,
    clearSearch,
    isSearchActive,
    searchResults,
    isLoadingSearch,
    hasNoResults,
  } = useGlobalSearchResults();
  const { defaultSections, isLoadingDefaults } = useGlobalSearchDefaults(!isSearchActive);

  useEffect(() => {
    track("search_open");
  }, []);

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const onSeeAll = useCallback(
    (category: GlobalSearchCategory) => {
      track("button_clicked", { button: "See all", page: ScreenName.GlobalSearch, category });

      if (category === "stable") return;

      navigation.navigate(ScreenName.MarketList, {
        category: category === "stocks" ? "stocks" : "all",
      });
    },
    [navigation],
  );

  const onAssetPress = useCallback(
    (asset: MarketAssetDisplayData) =>
      openFromMarket({
        marketCurrencyId: asset.id,
        ledgerCurrencyIds: asset.ledgerIds,
        source: ScreenName.GlobalSearch,
      }),
    [openFromMarket],
  );

  const onStockPress = useCallback(
    (stock: StockSuggestion) =>
      openFromMarket({
        marketCurrencyId: stock.navigationId,
        ledgerCurrencyIds: [stock.ledgerId],
        source: ScreenName.GlobalSearch,
      }),
    [openFromMarket],
  );

  return {
    search,
    setSearch,
    clearSearch,
    isSearchActive,
    isLoadingDefaults,
    isLoadingSearch,
    hasNoResults,
    defaultSections,
    searchResults,
    onBack,
    onSeeAll,
    onAssetPress,
    onStockPress,
  };
}
