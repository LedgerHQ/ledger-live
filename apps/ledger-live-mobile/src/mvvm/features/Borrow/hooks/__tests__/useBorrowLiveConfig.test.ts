import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useBorrowLiveConfig } from "../useBorrowLiveConfig";

describe("useBorrowLiveConfig", () => {
  it("should return the feature flag value", () => {
    const config = { enabled: true, params: { manifest_id: "borrow-v2" } };
    const { result } = renderHook(() => useBorrowLiveConfig(), {
      overrideInitialState: withFlagOverrides({
        ptxBorrowLiveApp: config,
      }),
    });
    expect(result.current).toEqual(config);
  });

  it("should return default feature config when not overridden", () => {
    const { result } = renderHook(() => useBorrowLiveConfig(), {
      overrideInitialState: withFlagOverrides({}),
    });
    expect(result.current).toEqual({
      enabled: false,
      params: { manifest_id: "borrow" },
    });
  });
});
