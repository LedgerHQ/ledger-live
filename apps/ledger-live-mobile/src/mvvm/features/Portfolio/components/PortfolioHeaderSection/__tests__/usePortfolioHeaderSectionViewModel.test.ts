import { renderHook, act } from "@tests/test-renderer";
import { usePortfolioHeaderSectionViewModel } from "../usePortfolioHeaderSectionViewModel";
import { CONTENT_AREA_HEIGHT } from "LLM/components/ScreenHeroSection/constants";

describe("usePortfolioHeaderSectionViewModel", () => {
  describe("minContentHeight", () => {
    it.each([
      { bannerHeight: 0, expected: undefined },
      { bannerHeight: 48, expected: CONTENT_AREA_HEIGHT - 48 },
      { bannerHeight: 300, expected: 0 },
    ])("is $expected when banner height is $bannerHeight", ({ bannerHeight, expected }) => {
      const { result } = renderHook(() => usePortfolioHeaderSectionViewModel());

      act(() => {
        result.current.onBannerHeightChange(bannerHeight);
      });

      expect(result.current.minContentHeight).toBe(expected);
    });

    it("resets to undefined when banner height goes back to 0 (banner dismissed)", () => {
      const { result } = renderHook(() => usePortfolioHeaderSectionViewModel());

      act(() => {
        result.current.onBannerHeightChange(48);
      });

      expect(result.current.minContentHeight).toBe(CONTENT_AREA_HEIGHT - 48);

      act(() => {
        result.current.onBannerHeightChange(0);
      });

      expect(result.current.minContentHeight).toBeUndefined();
    });
  });
});
