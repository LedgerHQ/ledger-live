import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DEFAULT_ELIGIBLE_ADDRESS_FAMILIES } from "@features/flow-contacts";
import { resolveContactsEntryConfig, useContactsEntryConfig } from "../useContactsEntryConfig";

const DEFAULT_CONFIG = {
  isEnabled: false,
  showNewBadge: false,
  eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
} as const;

describe("resolveContactsEntryConfig", () => {
  it("should return disabled config without a feature value", () => {
    expect(resolveContactsEntryConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it("should return enabled config with a new badge only when the flag and param are enabled", () => {
    expect(
      resolveContactsEntryConfig({
        enabled: true,
        params: { newBadge: true, eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES] },
      }),
    ).toEqual({
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
    });
  });
});

describe("useContactsEntryConfig", () => {
  it("should return disabled config with the default registry value", () => {
    const { result } = renderHook(() => useContactsEntryConfig());

    expect(result.current).toEqual(DEFAULT_CONFIG);
  });

  it("should return no new badge when the flag is disabled", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: {
          enabled: false,
          params: {
            newBadge: true,
            eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
          },
        },
      }),
    });

    expect(result.current).toEqual(DEFAULT_CONFIG);
  });

  it("should return enabled without new badge when newBadge is false", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: {
          enabled: true,
          params: {
            newBadge: false,
            eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
          },
        },
      }),
    });

    expect(result.current).toEqual({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
    });
  });

  it("should return enabled with new badge when newBadge is true", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: {
          enabled: true,
          params: {
            newBadge: true,
            eligibleAddressFamilies: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
          },
        },
      }),
    });

    expect(result.current).toEqual({
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
    });
  });
});
