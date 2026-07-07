import { act, renderHook } from "@tests/test-renderer";
import type { MarketListCategory } from "~/reducers/types";
import { useMarketCategories } from "../useMarketCategories";

let mockFocusCallback: (() => void) | null = null;

jest.mock("@react-navigation/native", () => {
  const React = jest.requireActual("react");

  return {
    ...jest.requireActual("@react-navigation/native"),
    useFocusEffect: jest.fn((cb: () => void) => {
      mockFocusCallback = cb;
      React.useEffect(() => cb(), [cb]);
    }),
  };
});

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/api"),
  useGetTrendingCategoriesQuery: () => ({ data: undefined }),
}));

function simulateFocus() {
  if (mockFocusCallback) mockFocusCallback();
}

describe("useMarketCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = null;
  });

  it("should default to the all category when no routeCategory is given", () => {
    const { result } = renderHook(() => useMarketCategories());
    expect(result.current.selectedCategory).toBe("all");
  });

  it("should use the routeCategory as the initial selected category", () => {
    const { result } = renderHook(() => useMarketCategories({ routeCategory: "stocks" }));
    expect(result.current.selectedCategory).toBe("stocks");
  });

  it("should allow switching the category", () => {
    const { result } = renderHook(() => useMarketCategories());

    act(() => result.current.onSelectCategory("stocks"));

    expect(result.current.selectedCategory).toBe("stocks");
  });

  it("should preserve the user-selected category when the screen regains focus (LIVE-33810)", () => {
    const { result } = renderHook(() => useMarketCategories({ routeCategory: "stocks" }));

    expect(result.current.selectedCategory).toBe("stocks");

    act(() => result.current.onSelectCategory("all"));

    expect(result.current.selectedCategory).toBe("all");

    act(() => simulateFocus());

    expect(result.current.selectedCategory).toBe("all");
  });

  it("should apply the routeCategory on first focus but not override subsequent user selections", () => {
    const { result } = renderHook(() => useMarketCategories({ routeCategory: "stocks" }));

    expect(result.current.selectedCategory).toBe("stocks");

    act(() => result.current.onSelectCategory("starred"));
    expect(result.current.selectedCategory).toBe("starred");

    act(() => simulateFocus());

    expect(result.current.selectedCategory).toBe("starred");
  });

  it("should apply a new routeCategory when it changes (rerender)", () => {
    let routeCategory: MarketListCategory | undefined = "stocks";
    const { result, rerender } = renderHook(() => useMarketCategories({ routeCategory }));

    expect(result.current.selectedCategory).toBe("stocks");

    act(() => result.current.onSelectCategory("all"));
    expect(result.current.selectedCategory).toBe("all");

    routeCategory = "starred";
    rerender(undefined);

    expect(result.current.selectedCategory).toBe("starred");
  });
});
