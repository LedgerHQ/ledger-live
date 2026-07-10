import { renderHook, withFlagOverrides } from "tests/testSetup";
import { resolveContactsEntryConfig, useContactsEntryConfig } from "../useContactsEntryConfig";

const ELIGIBLE_ADDRESS_FAMILIES = ["evm"];

describe("resolveContactsEntryConfig", () => {
  it("should return disabled config without a feature value", () => {
    expect(resolveContactsEntryConfig(null)).toEqual({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });

  it("should return enabled config with a new badge only when the flag and param are enabled", () => {
    expect(
      resolveContactsEntryConfig({
        enabled: true,
        params: { newBadge: true, eligibleAddressFamilies: [...ELIGIBLE_ADDRESS_FAMILIES] },
      }),
    ).toEqual({
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });
});

describe("useContactsEntryConfig", () => {
  it("should return disabled config with the default registry value", () => {
    const { result } = renderHook(() => useContactsEntryConfig());

    expect(result.current).toEqual({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });

  it("should return no new badge when the flag is disabled", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: false,
          params: { newBadge: true, eligibleAddressFamilies: [...ELIGIBLE_ADDRESS_FAMILIES] },
        },
      }),
    });

    expect(result.current).toEqual({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });

  it("should return enabled without new badge when newBadge is false", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: [...ELIGIBLE_ADDRESS_FAMILIES] },
        },
      }),
    });

    expect(result.current).toEqual({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });

  it("should return enabled with new badge when newBadge is true", () => {
    const { result } = renderHook(() => useContactsEntryConfig(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: true, eligibleAddressFamilies: [...ELIGIBLE_ADDRESS_FAMILIES] },
        },
      }),
    });

    expect(result.current).toEqual({
      isEnabled: true,
      showNewBadge: true,
      eligibleAddressFamilies: ELIGIBLE_ADDRESS_FAMILIES,
    });
  });
});
