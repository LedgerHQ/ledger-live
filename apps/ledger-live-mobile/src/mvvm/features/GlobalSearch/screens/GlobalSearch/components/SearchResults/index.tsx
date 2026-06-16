import React, { useCallback } from "react";
import { FlatList, View, type ListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import AssetListItem, {
  AssetLoadingState,
  type MarketAssetDisplayData,
} from "LLM/components/AssetListItem";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { StatusView } from "../StatusView";
import { GLOBAL_SEARCH_TEST_IDS } from "../../testIds";

const SKELETON_COUNT = 3;

type Props = Readonly<{
  results: MarketAssetDisplayData[];
  isLoading: boolean;
  hasNoResults: boolean;
  hasError: boolean;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
}>;

export function SearchResults({ results, isLoading, hasNoResults, hasError, onAssetPress }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<MarketAssetDisplayData>) => (
      <AssetListItem variant="market" market={item} onPress={onAssetPress} lx={rowStyle} />
    ),
    [onAssetPress],
  );

  if (hasError) {
    return (
      <StatusView
        icon={Warning}
        message={t("market.assets.error.title")}
        testID={GLOBAL_SEARCH_TEST_IDS.searchError}
      />
    );
  }

  if (isLoading) {
    return (
      <AssetLoadingState
        count={SKELETON_COUNT}
        lx={skeletonStyle}
        skeletonTestID={GLOBAL_SEARCH_TEST_IDS.searchSkeleton}
      />
    );
  }

  if (hasNoResults) {
    return (
      <StatusView
        icon={Search}
        message={t("modularDrawer.emptyAssetList")}
        testID={GLOBAL_SEARCH_TEST_IDS.searchEmptyState}
      />
    );
  }

  return (
    <View style={listContainerStyle}>
      <FlatList
        testID={GLOBAL_SEARCH_TEST_IDS.searchResults}
        style={listStyle}
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          ...contentContainerStyle,
          paddingBottom: GRADIENT_HEIGHT + bottom,
        }}
      />
      <BottomFadeGradient />
    </View>
  );
}

const listContainerStyle = { flex: 1 };
const listStyle = { flex: 1 };
const contentContainerStyle = { paddingTop: 8, paddingHorizontal: 16 };
const rowStyle: LumenViewStyle = { marginHorizontal: "-s8" };
const skeletonStyle: LumenViewStyle = { paddingTop: "s8", paddingHorizontal: "s16" };
