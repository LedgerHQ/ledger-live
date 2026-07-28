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
      result.current.setCustomFamiliesInput("evm, stellar, aptos");
    });

    act(() => {
      result.current.handleApplyCustomFamilies();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: false, eligibleAddressFamilies: ["evm", "stellar", "aptos"] },
    });
    expect(result.current.customFamiliesInput).toBe("evm, stellar, aptos");
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
      result.current.setCustomFamiliesInput("EVM, evm, stellar, Stellar");
    });

    act(() => {
      result.current.handleApplyCustomFamilies();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: { newBadge: false, eligibleAddressFamilies: ["evm", "stellar"] },
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
      result.current.setCustomFamiliesInput("evm, stellar");
    });

    act(() => {
      result.current.handleToggleEnabled();
    });

    expect(result.current.customFamiliesInput).toBe("evm, stellar");
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
      result.current.setCustomFamiliesInput("evm, aptos");
    });

    act(() => {
      result.current.handleToggleNewBadge();
    });

    expect(result.current.customFamiliesInput).toBe("evm, aptos");
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

  it("should load populated contacts into the contacts slice", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleLoadPopulatedContacts();
    });

    expect(store.getState().contacts.contacts).toHaveLength(4);
    expect(store.getState().contacts.contacts.map(contact => contact.name)).toEqual([
      "Me",
      "Ada",
      "Ben",
      "Olive",
    ]);
  });

  it("should reset contacts to the default Me contact", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleLoadPopulatedContacts();
    });

    act(() => {
      result.current.handleResetContacts();
    });

    expect(store.getState().contacts.contacts).toEqual([
      expect.objectContaining({ id: "contact-me", isMe: true, name: "Me", addresses: [] }),
    ]);
  });

  it("should toggle hasDismissedContactsFeatureIntroduction", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: {
        settings: { hasDismissedContactsFeatureIntroduction: true },
      },
    });

    expect(result.current.hasDismissedFeatureIntroduction).toBe(true);

    act(() => {
      result.current.handleToggleFeatureIntroductionDismissed();
    });

    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(false);
  });
});
