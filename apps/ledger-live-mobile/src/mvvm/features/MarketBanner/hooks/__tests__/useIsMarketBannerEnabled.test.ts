import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { renderHook } from "@tests/test-renderer";
import { useIsMarketBannerEnabled } from "../useIsMarketBannerEnabled";

jest.mock("@ledgerhq/live-common/featureFlags/index");

const mockUseFeature = useFeature as jest.Mock;

describe("useIsMarketBannerEnabled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when lwmWallet40 is enabled and marketBanner param is true", () => {
    mockUseFeature.mockReturnValue({
      enabled: true,
      params: { marketBanner: true },
    });

    const { result } = renderHook(() => useIsMarketBannerEnabled());

    expect(result.current).toBe(true);
  });

  it("should return false when lwmWallet40 is disabled", () => {
    mockUseFeature.mockReturnValue({
      enabled: false,
      params: { marketBanner: true },
    });

    const { result } = renderHook(() => useIsMarketBannerEnabled());

    expect(result.current).toBe(false);
  });

  it("should return false when marketBanner param is false", () => {
    mockUseFeature.mockReturnValue({
      enabled: true,
      params: { marketBanner: false },
    });

    const { result } = renderHook(() => useIsMarketBannerEnabled());

    expect(result.current).toBe(false);
  });

  it("should return false when marketBanner param is undefined", () => {
    mockUseFeature.mockReturnValue({
      enabled: true,
      params: {},
    });

    const { result } = renderHook(() => useIsMarketBannerEnabled());

    expect(result.current).toBe(false);
  });

  it("should return false when feature flag is null", () => {
    mockUseFeature.mockReturnValue(null);

    const { result } = renderHook(() => useIsMarketBannerEnabled());

    expect(result.current).toBe(false);
  });
});
