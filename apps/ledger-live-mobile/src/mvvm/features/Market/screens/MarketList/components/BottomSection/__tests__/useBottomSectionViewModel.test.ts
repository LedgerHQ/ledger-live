import { renderHook, act } from "@tests/test-renderer";
import { track } from "~/analytics";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import useBottomSectionViewModel from "../useBottomSectionViewModel";
import { withMarketState } from "LLM/features/Market/__tests__/helpers";

const mockedTrack = jest.mocked(track);

describe("useBottomSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return range, order and counterCurrency from Redux market state", () => {
    const { result } = renderHook(
      () => useBottomSectionViewModel(),
      withMarketState({
        marketParams: {
          range: "7d",
          order: Order.MarketCapAsc,
          counterCurrency: "eur",
        },
      }),
    );

    expect(result.current.range).toBe("7d");
    expect(result.current.order).toBe(Order.MarketCapAsc);
    expect(result.current.counterCurrency).toBe("eur");
  });

  it("should toggle filterByStarredCurrencies and reset page", () => {
    const { result, store } = renderHook(
      () => useBottomSectionViewModel(),
      withMarketState({ marketFilterByStarredCurrencies: false }),
    );

    expect(result.current.filterByStarredCurrencies).toBe(false);

    act(() => {
      result.current.toggleFilterByStarredCurrencies();
    });

    expect(store.getState().market.marketFilterByStarredCurrencies).toBe(true);
    expect(store.getState().market.marketCurrentPage).toBe(1);
    expect(store.getState().market.marketParams.page).toBe(1);
  });

  it("should track analytics when enabling starred filter", () => {
    const { result } = renderHook(
      () => useBottomSectionViewModel(),
      withMarketState({ marketFilterByStarredCurrencies: false }),
    );

    act(() => {
      result.current.toggleFilterByStarredCurrencies();
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      "Page Market Favourites",
      expect.objectContaining({ access: false }),
    );
  });

  it("should not track analytics when disabling starred filter", () => {
    const { result } = renderHook(
      () => useBottomSectionViewModel(),
      withMarketState({ marketFilterByStarredCurrencies: true }),
    );

    act(() => {
      result.current.toggleFilterByStarredCurrencies();
    });

    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("should dispatch new params and reset page on onFilterChange", () => {
    const { result, store } = renderHook(() => useBottomSectionViewModel(), withMarketState());

    act(() => {
      result.current.onFilterChange({ range: "30d" });
    });

    expect(store.getState().market.marketParams.range).toBe("30d");
    expect(store.getState().market.marketCurrentPage).toBe(1);
    expect(store.getState().market.marketParams.page).toBe(1);
  });

  it("should track analytics with merged params on onFilterChange", () => {
    const { result } = renderHook(() => useBottomSectionViewModel(), withMarketState());

    act(() => {
      result.current.onFilterChange({ range: "7d" });
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      "Page Market",
      expect.objectContaining({
        access: false,
        "%change": "7d",
      }),
    );
  });
});
