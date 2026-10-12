import { act, renderHook } from "@tests/test-renderer";
import type {
  LayoutChangeEvent,
  ViewToken,
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

const onVisibleIndexChange = jest.fn();

function viewToken(index: number | null): ViewToken<MarketAssetDisplayData> {
  return { index, isViewable: true, key: String(index), item: {} as MarketAssetDisplayData };
}

describe("useMarketAssetsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reserve the viewport space below the header and category tabs for empty states", () => {
    const { result } = renderHook(() =>
      useMarketAssetsList({
        assets: [],
        selectedCategory: "favorites",
        showSubheader: true,
        onVisibleIndexChange,
      }),
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
      useMarketAssetsList({
        assets: [],
        selectedCategory,
        showSubheader: true,
        onVisibleIndexChange,
      }),
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
      useMarketAssetsList({
        assets: [],
        selectedCategory,
        showSubheader: true,
        onVisibleIndexChange,
      }),
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

  it("should report the last visible row index", () => {
    const { result } = renderHook(() =>
      useMarketAssetsList({
        assets: [],
        selectedCategory: "all",
        showSubheader: true,
        onVisibleIndexChange,
      }),
    );

    act(() => {
      result.current.handleViewableItemsChanged({
        viewableItems: [viewToken(null), viewToken(21), viewToken(23), viewToken(22)],
        changed: [],
      });
    });

    expect(onVisibleIndexChange).toHaveBeenCalledWith(23);
  });

  it("should not report anything when no row is visible", () => {
    const { result } = renderHook(() =>
      useMarketAssetsList({
        assets: [],
        selectedCategory: "all",
        showSubheader: true,
        onVisibleIndexChange,
      }),
    );

    act(() => {
      result.current.handleViewableItemsChanged({ viewableItems: [viewToken(null)], changed: [] });
    });

    expect(onVisibleIndexChange).not.toHaveBeenCalled();
  });

  it("should keep the viewability handler stable and call the latest callback", () => {
    let callback = jest.fn();
    const { result, rerender } = renderHook(() =>
      useMarketAssetsList({
        assets: [],
        selectedCategory: "all",
        showSubheader: true,
        onVisibleIndexChange: callback,
      }),
    );
    const initialHandler = result.current.handleViewableItemsChanged;

    callback = jest.fn();
    rerender(undefined);

    expect(result.current.handleViewableItemsChanged).toBe(initialHandler);

    act(() => {
      result.current.handleViewableItemsChanged({ viewableItems: [viewToken(4)], changed: [] });
    });

    expect(callback).toHaveBeenCalledWith(4);
  });
});
