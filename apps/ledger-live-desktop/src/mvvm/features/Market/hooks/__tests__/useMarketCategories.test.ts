import { act, renderHook } from "tests/testSetup";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import type { MarketListCategory } from "~/renderer/reducers/market";
import { track } from "~/renderer/analytics/segment";
import { useMarketCategories } from "../useMarketCategories";

const createMarketState = (category: MarketListCategory = "all") => ({
  marketParams: {
    range: "24h",
    limit: 50,
    starred: [],
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "USD",
  },
  currentPage: 1,
  hideTransactionsOnChart: false,
  category,
});

describe("useMarketCategories", () => {
  beforeEach(() => jest.clearAllMocks());

  it("exposes the persisted category and the ordered tabs", () => {
    const { result } = renderHook(() => useMarketCategories(), {
      initialState: { market: createMarketState("all") },
    });

    expect(result.current.selectedCategory).toBe("all");
    expect(result.current.tabs.map(tab => tab.value)).toEqual(["all", "stocks", "starred"]);
  });

  it("selects a new category and tracks the tap", () => {
    const { result } = renderHook(() => useMarketCategories(), {
      initialState: { market: createMarketState("all") },
    });

    act(() => result.current.onSelectCategory("stocks"));

    expect(result.current.selectedCategory).toBe("stocks");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "stocks",
      page: "Market",
    });
  });

  it("does not change state when re-selecting the active category", () => {
    const { result } = renderHook(() => useMarketCategories(), {
      initialState: { market: createMarketState("starred") },
    });

    act(() => result.current.onSelectCategory("starred"));

    expect(result.current.selectedCategory).toBe("starred");
  });
});
