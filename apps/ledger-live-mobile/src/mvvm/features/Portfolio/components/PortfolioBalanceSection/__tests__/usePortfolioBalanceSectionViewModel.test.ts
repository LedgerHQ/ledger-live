import { renderHook } from "@tests/test-renderer";
import { usePortfolioBalanceSectionViewModel } from "../usePortfolioBalanceSectionViewModel";

const defaultProps = { showAssets: true, isReadOnlyMode: false };

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
    it("should be false when not syncing", () => {
      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      expect(result.current.isLoading).toBe(false);
    });
  });
});
