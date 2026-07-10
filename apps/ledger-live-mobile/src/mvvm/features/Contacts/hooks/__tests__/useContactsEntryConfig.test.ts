import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { resolveContactsEntryConfig, useContactsEntryConfig } from "../useContactsEntryConfig";

describe("resolveContactsEntryConfig", () => {
  it("should return disabled config without a feature value", () => {
    expect(resolveContactsEntryConfig(null)).toEqual({
      isEnabled: false,
      showNewBadge: false,
    });
  });

  it("should return enabled config with a new badge only when the flag and param are enabled", () => {
    expect(resolveContactsEntryConfig({ enabled: true, params: { newBadge: true } })).toEqual({
      isEnabled: true,
      showNewBadge: true,
    });
  });
});

describe("useContactsEntryConfig", () => {
  it("should return disabled config with the default registry value", () => {
    const { result } = renderHook(() => useContactsEntryConfig());

    expect(result.current).toEqual({ isEnabled: false, showNewBadge: false });
  });

  it("should return no new badge when the flag is disabled", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: true } },
      }),
    });

    expect(result.current).toEqual({ isEnabled: false, showNewBadge: false });
  });

  it("should return enabled without new badge when newBadge is false", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(result.current).toEqual({ isEnabled: true, showNewBadge: false });
  });

  it("should return enabled with new badge when newBadge is true", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: true } },
      }),
    });

    expect(result.current).toEqual({ isEnabled: true, showNewBadge: true });
  });
});
