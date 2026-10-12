import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  ViewToken,
} from "react-native";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import type { MarketListCategory } from "~/reducers/types";

type UseMarketAssetsListParams = Readonly<{
  assets: MarketAssetDisplayData[];
  selectedCategory: MarketListCategory;
  showSubheader: boolean;
  onVisibleIndexChange: (index: number) => void;
}>;

export const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 72,
};

export function useMarketAssetsList({
  assets,
  selectedCategory,
  showSubheader,
  onVisibleIndexChange,
}: UseMarketAssetsListParams) {
  const [listHeight, setListHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [categorySwitcherHeight, setCategorySwitcherHeight] = useState(0);
  const listRef = useRef<SectionList<MarketAssetDisplayData>>(null);
  const scrollOffsetRef = useRef(0);
  const previousCategoryRef = useRef(selectedCategory);

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height);
  }, []);

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  }, []);

  const handleCategorySwitcherLayout = useCallback((event: LayoutChangeEvent) => {
    setCategorySwitcherHeight(event.nativeEvent.layout.height);
  }, []);

  const onVisibleIndexChangeRef = useRef(onVisibleIndexChange);
  useEffect(() => {
    onVisibleIndexChangeRef.current = onVisibleIndexChange;
  }, [onVisibleIndexChange]);

  const handleViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MarketAssetDisplayData>[];
      changed: unknown;
    }) => {
      const visibleIndexes = viewableItems.flatMap(({ index }) => (index == null ? [] : [index]));
      if (visibleIndexes.length === 0) return;
      onVisibleIndexChangeRef.current(Math.max(...visibleIndexes));
    },
    [],
  );

  const keyExtractor = useCallback((item: MarketAssetDisplayData) => item.id, []);

  const sections = useMemo(() => [{ data: assets }], [assets]);

  useEffect(() => {
    if (previousCategoryRef.current === selectedCategory) return;
    previousCategoryRef.current = selectedCategory;
    if (!showSubheader || headerHeight === 0) return;
    if (scrollOffsetRef.current <= headerHeight) return;
    listRef.current?.getScrollResponder()?.scrollTo({ y: headerHeight, animated: false });
    scrollOffsetRef.current = headerHeight;
  }, [headerHeight, selectedCategory, showSubheader]);

  return {
    listRef,
    sections,
    contentMinHeight: showSubheader ? headerHeight + listHeight : undefined,
    footerMinHeight: listHeight,
    emptyFooterHeight: showSubheader
      ? Math.max(listHeight - headerHeight - categorySwitcherHeight, 0)
      : listHeight,
    handleScrollEnd,
    handleListLayout,
    handleHeaderLayout,
    handleCategorySwitcherLayout,
    handleViewableItemsChanged,
    keyExtractor,
  };
}
