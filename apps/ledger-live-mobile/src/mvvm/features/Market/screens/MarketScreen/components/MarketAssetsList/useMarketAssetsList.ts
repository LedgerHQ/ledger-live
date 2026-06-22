import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
} from "react-native";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import type { MarketListCategory } from "~/reducers/types";

type UseMarketAssetsListParams = Readonly<{
  assets: MarketAssetDisplayData[];
  selectedCategory: MarketListCategory;
  showSubheader: boolean;
}>;

export function useMarketAssetsList({
  assets,
  selectedCategory,
  showSubheader,
}: UseMarketAssetsListParams) {
  const [listHeight, setListHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
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
    handleScrollEnd,
    handleListLayout,
    handleHeaderLayout,
    keyExtractor,
  };
}
