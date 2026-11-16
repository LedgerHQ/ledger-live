import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountDetailAnalyticsBannerFeature } from "./useAccountDetailAnalyticsBannerFeature";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

describe("useAccountDetailAnalyticsBannerFeature", () => {
  it("reads the accountDetail flag", () => {
    mockUseFeature.mockReturnValue({ enabled: true, params: { analyticsBanner: true } });

    renderHook(() => useAccountDetailAnalyticsBannerFeature());

    expect(mockUseFeature).toHaveBeenCalledWith("accountDetail");
  });

  it("is enabled when the analyticsBanner param is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true, params: { analyticsBanner: true } });

    const { result } = renderHook(() => useAccountDetailAnalyticsBannerFeature());

    expect(result.current).toBe(true);
  });

  it("is disabled when the analyticsBanner param is off", () => {
    mockUseFeature.mockReturnValue({ enabled: true, params: { analyticsBanner: false } });

    const { result } = renderHook(() => useAccountDetailAnalyticsBannerFeature());

    expect(result.current).toBe(false);
  });
});
