import { renderHook } from "@tests/test-renderer";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";
import { State } from "~/reducers/types";
import { INITIAL_STATE as portfolioBalanceDisplayInitialState } from "~/reducers/portfolioBalanceDisplay";

describe("usePortfolioBalanceForDisplay", () => {
  it("returns initial state values when slice is at default", () => {
    const { result } = renderHook(() => usePortfolioBalanceForDisplay());

    expect(result.current.displayedBalance).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isBalanceAvailable).toBe(false);
  });

  it("reflects displayedBalance from the slice", () => {
    const { result } = renderHook(() => usePortfolioBalanceForDisplay(), {
      overrideInitialState: (state: State) => ({
        ...state,
        portfolioBalanceDisplay: {
          ...portfolioBalanceDisplayInitialState,
          displayedBalance: 98765,
          isBalanceAvailable: true,
        },
      }),
    });

    expect(result.current.displayedBalance).toBe(98765);
    expect(result.current.isBalanceAvailable).toBe(true);
  });

  it("reflects isLoading from the slice", () => {
    const { result } = renderHook(() => usePortfolioBalanceForDisplay(), {
      overrideInitialState: (state: State) => ({
        ...state,
        portfolioBalanceDisplay: {
          ...portfolioBalanceDisplayInitialState,
          isLoading: true,
        },
      }),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns a unit derived from the counter-value currency", () => {
    const { result } = renderHook(() => usePortfolioBalanceForDisplay());

    expect(result.current.unit).toBeDefined();
    expect(result.current.unit.code).toBeDefined();
  });
});
