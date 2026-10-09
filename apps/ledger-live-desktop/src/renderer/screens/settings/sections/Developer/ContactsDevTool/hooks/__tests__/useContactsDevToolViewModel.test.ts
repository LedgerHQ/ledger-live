import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useContactsDevToolViewModel } from "../useContactsDevToolViewModel";
import type { Contact } from "@domain/entity-contact";

describe("useContactsDevToolViewModel", () => {
  it("should expose disabled defaults when the flag is not overridden", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel());

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.params).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
      excludedCurrencyIds: [],
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
      params: { newBadge: false, eligibleAddressFamilies: ["evm"], excludedCurrencyIds: [] },
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
      params: { newBadge: true, eligibleAddressFamilies: ["evm"], excludedCurrencyIds: [] },
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
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm", "stellar", "aptos"],
        excludedCurrencyIds: [],
      },
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
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm", "stellar"],
        excludedCurrencyIds: [],
      },
    });
  });

  it("should apply excludedCurrencyIds, deduplicating entries", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setExcludedCurrencyIdsInput("ethereum, bitcoin, ethereum");
    });

    act(() => {
      result.current.handleApplyExcludedCurrencyIds();
    });

    expect(store.getState().featureFlags.overrides.lwdContacts).toEqual({
      enabled: true,
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm"],
        excludedCurrencyIds: ["ethereum", "bitcoin"],
      },
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

  it("should drop in-progress inputs and show the defaults once the override is reset", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: {
            newBadge: false,
            eligibleAddressFamilies: ["evm", "stellar"],
            excludedCurrencyIds: ["bitcoin"],
          },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("aptos");
      result.current.setExcludedCurrencyIdsInput("ethereum");
    });

    expect(result.current.customFamiliesInput).toBe("aptos");
    expect(result.current.excludedCurrencyIdsInput).toBe("ethereum");

    act(() => {
      result.current.handleResetOverride();
    });

    expect(result.current.customFamiliesInput).toBe("evm");
    expect(result.current.excludedCurrencyIdsInput).toBe("");
  });

  it("should drop an in-progress families input when a preset is selected", () => {
    const { result } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm", "stellar"] },
        },
      }),
    });

    act(() => {
      result.current.setCustomFamiliesInput("aptos");
    });

    act(() => {
      result.current.handleSetEligibleAddressFamilies(["evm"]);
    });

    expect(result.current.customFamiliesInput).toBe("evm");
  });

  it("should trim excludedCurrencyIds and drop empty entries", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    act(() => {
      result.current.setExcludedCurrencyIdsInput(" ethereum ,, bitcoin ");
    });

    act(() => {
      result.current.handleApplyExcludedCurrencyIds();
    });

    expect(
      store.getState().featureFlags.overrides.lwdContacts?.params?.excludedCurrencyIds,
    ).toEqual(["ethereum", "bitcoin"]);
    expect(result.current.excludedCurrencyIdsInput).toBe("ethereum, bitcoin");
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

    expect(store.getState().contacts.contacts).toHaveLength(6);
    expect(store.getState().contacts.contacts.map((contact: Contact) => contact.name)).toEqual([
      "Me",
      "Ada",
      "Ben",
      "Charlie",
      "Diana",
      "Olive",
    ]);
    expect(store.getState().contacts.contacts[0]?.addresses).toHaveLength(3);
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
