import { act, renderHook } from "@tests/test-renderer";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
} from "react-native";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import type { MarketListCategory } from "~/reducers/types";
import { useMarketAssetsList } from "../useMarketAssetsList";

const headerHeight = 128;
const categorySwitcherHeight = 48;
const listHeight = 500;

function layoutEvent(height: number): LayoutChangeEvent {
  return { nativeEvent: { layout: { height } } } as LayoutChangeEvent;
}

function scrollEvent(y: number): NativeSyntheticEvent<NativeScrollEvent> {
  return { nativeEvent: { contentOffset: { y } } } as NativeSyntheticEvent<NativeScrollEvent>;
}

function assignScrollResponder(
  ref: React.RefObject<SectionList<MarketAssetDisplayData> | null>,
  scrollTo: jest.Mock,
) {
  const listRef = ref as React.MutableRefObject<SectionList<MarketAssetDisplayData> | null>;
  listRef.current = {
    getScrollResponder: () => ({ scrollTo }),
  } as unknown as SectionList<MarketAssetDisplayData>;
}

describe("useMarketAssetsList", () => {
  it("should reserve the viewport space below the header and category tabs for empty states", () => {
    const { result } = renderHook(() =>
      useMarketAssetsList({ assets: [], selectedCategory: "favorites", showSubheader: true }),
    );

    act(() => {
      result.current.handleListLayout(layoutEvent(listHeight));
      result.current.handleHeaderLayout(layoutEvent(headerHeight));
      result.current.handleCategorySwitcherLayout(layoutEvent(categorySwitcherHeight));
    });

    expect(result.current.contentMinHeight).toBe(headerHeight + listHeight);
    expect(result.current.footerMinHeight).toBe(listHeight);
    expect(result.current.emptyFooterHeight).toBe(
      listHeight - headerHeight - categorySwitcherHeight,
    );
  });

  it("should keep the category tabs pinned when changing category after the header", () => {
    let selectedCategory: MarketListCategory = "all";
    const scrollTo = jest.fn();
    const { result, rerender } = renderHook(() =>
      useMarketAssetsList({ assets: [], selectedCategory, showSubheader: true }),
    );

    assignScrollResponder(result.current.listRef, scrollTo);
    act(() => {
      result.current.handleHeaderLayout(layoutEvent(headerHeight));
      result.current.handleScrollEnd(scrollEvent(headerHeight + 1));
    });

    selectedCategory = "stocks";
    rerender(undefined);

    expect(scrollTo).toHaveBeenCalledWith({ y: headerHeight, animated: false });
  });

  it("should not scroll when changing category before the header", () => {
    let selectedCategory: MarketListCategory = "all";
    const scrollTo = jest.fn();
    const { result, rerender } = renderHook(() =>
      useMarketAssetsList({ assets: [], selectedCategory, showSubheader: true }),
    );

    assignScrollResponder(result.current.listRef, scrollTo);
    act(() => {
      result.current.handleHeaderLayout(layoutEvent(headerHeight));
      result.current.handleScrollEnd(scrollEvent(headerHeight));
    });

    selectedCategory = "stocks";
    rerender(undefined);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
