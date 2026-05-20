import { renderHook } from "@testing-library/react";
import { useHasLocallyOverriddenFeatureFlags } from "../useHasLocallyOverriddenFeatureFlags";
import { makeStoreWrapper, FEATURE_FLAGS_DEFAULTS } from "../../__tests__/renderWithStore";

describe("useHasLocallyOverriddenFeatureFlags", () => {
  it("is false when no resolved flag carries override metadata", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(false);
  });

  it("is true when a resolved flag carries overridesRemote", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: {
        ...FEATURE_FLAGS_DEFAULTS,
        mockFeature: { enabled: true, overridesRemote: true },
      },
    });
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(true);
  });

  it("is true when a resolved flag carries overriddenByEnv", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: {
        ...FEATURE_FLAGS_DEFAULTS,
        mockFeature: { enabled: true, overriddenByEnv: true },
      },
    });
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(true);
  });
});
