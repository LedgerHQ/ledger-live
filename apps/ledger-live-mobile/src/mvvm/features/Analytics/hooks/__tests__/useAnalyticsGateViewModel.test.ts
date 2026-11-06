import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useAnalyticsGateViewModel } from "../../useAnalyticsGateViewModel";

describe("useAnalyticsGateViewModel", () => {
  it.each([true, false])("should follow the accountDetail flag (%s)", enabled => {
    const { result } = renderHook(() => useAnalyticsGateViewModel(), {
      overrideInitialState: withFlagOverrides({ accountDetail: { enabled } }),
    });
    expect(result.current.enabled).toBe(enabled);
  });
});
