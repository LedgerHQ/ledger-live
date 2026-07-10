import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useContactsDevToolViewModel } from "../useContactsDevToolViewModel";

describe("useContactsDevToolViewModel", () => {
  it("should expose disabled defaults when the flag is not overridden", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel());

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.params).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    expect(result.current.customFamiliesInput).toBe("evm");
  });

  it("should toggle lwdContacts.enabled", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: false,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.handleToggleEnabled();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
    });
  });

  it("should toggle lwdContacts.params.newBadge", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.handleToggleNewBadge();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: true, eligibleAddressFamilies: ["evm"] },
    });
  });

  it("should apply custom eligibleAddressFamilies values", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("evm, bitcoin, solana");
    });

    act(() => {
      result.current.handleApplyCustomFamilies();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: false, eligibleAddressFamilies: ["evm", "bitcoin", "solana"] },
    });
    expect(result.current.customFamiliesInput).toBe("evm, bitcoin, solana");
  });

  it("should deduplicate and normalize custom eligibleAddressFamilies values", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("EVM, evm, bitcoin, Bitcoin");
    });

    act(() => {
      result.current.handleApplyCustomFamilies();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: false, eligibleAddressFamilies: ["evm", "bitcoin"] },
    });
  });

  it("should not reset in-progress custom families input when toggling enabled", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: false,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("evm, bitcoin");
    });

    act(() => {
      result.current.handleToggleEnabled();
    });

    expect(result.current.customFamiliesInput).toBe("evm, bitcoin");
  });

  it("should not reset in-progress custom families input when toggling newBadge", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("evm, solana");
    });

    act(() => {
      result.current.handleToggleNewBadge();
    });

    expect(result.current.customFamiliesInput).toBe("evm, solana");
  });

  it("should reset the local override", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: true, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.handleResetOverride();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toBeUndefined();
  });
});
