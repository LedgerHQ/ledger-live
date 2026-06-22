import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { useGetTrendingCategoriesQuery } from "@ledgerhq/live-common/market/state-manager/api";
import type { MarketListCategory } from "~/renderer/reducers/market";
import { track } from "~/renderer/analytics/segment";
import { useMarketCategories } from "../useMarketCategories";

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/api"),
  useGetTrendingCategoriesQuery: jest.fn(),
}));

const mockedUseTrending = useGetTrendingCategoriesQuery as jest.Mock;

const assetDiscoverabilityOn = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

const assetDiscoverabilityOff = withFlagOverrides({
  lwdWallet40: { enabled: false },
});

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

const renderCategories = (category: MarketListCategory = "all", flags = assetDiscoverabilityOn) =>
  renderHook(() => useMarketCategories(), {
    initialState: {
      ...flags,
      market: createMarketState(category),
    },
  });

describe("useMarketCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTrending.mockReturnValue({ data: undefined });
  });

  it("exposes the persisted category and the built-in tabs", () => {
    const { result } = renderCategories("all");

    expect(result.current.selectedCategory).toBe("all");
    expect(result.current.tabs.map(tab => tab.value)).toEqual(["all", "starred", "stocks"]);
  });

  it("selects a new category and tracks the tap", () => {
    const { result } = renderCategories("all");

    act(() => result.current.onSelectCategory("stocks"));

    expect(result.current.selectedCategory).toBe("stocks");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "stocks",
      page: "Market",
    });
  });

  it("does not change state when re-selecting the active category", () => {
    const { result } = renderCategories("starred");

    act(() => result.current.onSelectCategory("starred"));

    expect(result.current.selectedCategory).toBe("starred");
  });

  it("appends trending categories after the built-in tabs, using their raw label", () => {
    mockedUseTrending.mockReturnValue({
      data: [{ id: "infrastructure", name: "Infrastructure" }],
    });

    const { result } = renderCategories("all");

    expect(result.current.tabs.map(tab => tab.value)).toEqual([
      "all",
      "starred",
      "stocks",
      "infrastructure",
    ]);
    expect(result.current.tabs.at(-1)).toEqual({
      value: "infrastructure",
      label: "Infrastructure",
    });
  });

  it("deduplicates trending ids that collide with a built-in category", () => {
    mockedUseTrending.mockReturnValue({
      data: [
        { id: "stocks", name: "Stocks duplicate" },
        { id: "infrastructure", name: "Infrastructure" },
      ],
    });

    const { result } = renderCategories("all");

    expect(result.current.tabs.map(tab => tab.value)).toEqual([
      "all",
      "starred",
      "stocks",
      "infrastructure",
    ]);
  });

  it("selects a trending category and tracks the tap", () => {
    mockedUseTrending.mockReturnValue({
      data: [{ id: "infrastructure", name: "Infrastructure" }],
    });

    const { result } = renderCategories("all");

    act(() => result.current.onSelectCategory("infrastructure"));

    expect(result.current.selectedCategory).toBe("infrastructure");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "infrastructure",
      page: "Market",
    });
  });

  it("falls back to 'all' when the persisted trending id is no longer trending", () => {
    mockedUseTrending.mockReturnValue({
      data: [{ id: "infrastructure", name: "Infrastructure" }],
    });

    const { result } = renderCategories("gaming");

    expect(result.current.selectedCategory).toBe("all");
  });

  it("skips the trending request when asset discoverability is off", () => {
    renderCategories("all", assetDiscoverabilityOff);

    expect(mockedUseTrending).toHaveBeenCalledWith(undefined, { skip: true });
  });
});
