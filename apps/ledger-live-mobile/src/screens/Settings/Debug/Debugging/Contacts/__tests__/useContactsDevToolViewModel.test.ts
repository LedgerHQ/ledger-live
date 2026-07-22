import { act } from "@testing-library/react-native";
import { CONTACTS_FEATURE_FLAG_KEYS } from "@features/flow-contacts";
import { renderHook } from "@tests/test-renderer";
import { ELIGIBLE_ADDRESS_FAMILIES_PRESETS } from "../constants";
import { useContactsDevToolViewModel } from "../useContactsDevToolViewModel";

const CONTACTS_FLAG = CONTACTS_FEATURE_FLAG_KEYS.mobile;

describe("useContactsDevToolViewModel", () => {
  it("should enable lwmContacts via setOverride when toggling enabled", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleToggleEnabled();
    });

    expect(store.getState().featureFlags.overrides[CONTACTS_FLAG]).toEqual({
      enabled: true,
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm"],
      },
    });
  });

  it("should toggle params.newBadge while keeping enabled state", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleToggleEnabled();
    });

    act(() => {
      result.current.handleToggleNewBadge();
    });

    expect(store.getState().featureFlags.overrides[CONTACTS_FLAG]).toEqual({
      enabled: true,
      params: {
        newBadge: true,
        eligibleAddressFamilies: ["evm"],
      },
    });
  });

  it("should set EVM-only eligibleAddressFamilies preset", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());
    const evmOnlyPreset = ELIGIBLE_ADDRESS_FAMILIES_PRESETS[0];

    act(() => {
      result.current.handleSetEligibleAddressFamilies(evmOnlyPreset.families);
    });

    expect(store.getState().featureFlags.overrides[CONTACTS_FLAG]?.params).toEqual({
      newBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
  });

  it("should clear the override when restoring defaults", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleToggleEnabled();
    });

    act(() => {
      result.current.handleRestoreDefaults();
    });

    expect(store.getState().featureFlags.overrides[CONTACTS_FLAG]).toBeUndefined();
  });

  it("should replace saved contacts with 25 sample contacts", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleLoadSamples();
    });

    const contacts = store.getState().contacts.contacts;

    expect(contacts).toHaveLength(26);
    expect(contacts[0]).toMatchObject({ id: "contact-me", isMe: true, name: "Me" });
    expect(contacts.filter(contact => !contact.isMe)).toHaveLength(25);
  });

  it("should preserve Me when clearing saved contacts", () => {
    const { result, store } = renderHook(() => useContactsDevToolViewModel());

    act(() => {
      result.current.handleLoadSamples();
      result.current.handleClearContacts();
    });

    expect(store.getState().contacts.contacts).toEqual([
      expect.objectContaining({ id: "contact-me", isMe: true, name: "Me" }),
    ]);
  });
});
