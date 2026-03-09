import { renderHook } from "@tests/test-renderer";
import { usePortfolioBalanceSectionViewModel } from "../usePortfolioBalanceSectionViewModel";
import { State } from "~/reducers/types";

const defaultProps = { showAssets: true, isReadOnlyMode: false };

const withRefreshing = (state: State): State => ({
  ...state,
  portfolioRefresh: { isRefreshing: true, lastSyncTimestampSnapshot: null },
});

describe("usePortfolioBalanceSectionViewModel", () => {
  describe("state determination", () => {
    it("should return 'noSigner' state when isReadOnlyMode is true", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: true,
        }),
      );

      expect(result.current.state).toBe("noSigner");
    });

    it("should return 'noAccounts' state when isReadOnlyMode is false and showAssets is false", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: false,
        }),
      );

      expect(result.current.state).toBe("noAccounts");
    });

    it("should return 'normal' state when isReadOnlyMode is false and showAssets is true", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: true,
          isReadOnlyMode: false,
        }),
      );

      expect(result.current.state).toBe("normal");
    });

    it("should prioritize noSigner over noAccounts when both conditions are met", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: true,
        }),
      );

      expect(result.current.state).toBe("noSigner");
    });
  });

  describe("isLoading", () => {
    it("should be false when balance is available and not refreshing", () => {
      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      expect(result.current.isLoading).toBe(false);
    });

    it("should be true when refreshing", () => {
      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps), {
        overrideInitialState: withRefreshing,
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
