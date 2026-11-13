import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import useAnalyticsMainViewModel from "../useAnalyticsMainViewModel";

describe("useAnalyticsMainViewModel", () => {
  it.each([true, false])("should follow the accountDetail flag (%s)", enabled => {
    const { result } = renderHook(() => useAnalyticsMainViewModel(), {
      overrideInitialState: withFlagOverrides({ accountDetail: { enabled } }),
    });
    expect(result.current.isAccountAnalyticsEnabled).toBe(enabled);
  });
});
