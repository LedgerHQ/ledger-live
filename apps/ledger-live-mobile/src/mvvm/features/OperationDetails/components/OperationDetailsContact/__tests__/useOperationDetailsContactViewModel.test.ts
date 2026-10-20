import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { addContact } from "@domain/entity-contact";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { useOperationDetailsContactViewModel } from "../useOperationDetailsContactViewModel";

const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const meAddress = "0xdd3f8f1234567890123456789012345678901234";

const ben = mockContact({
  id: "contact-ben",
  name: "Ben",
  addresses: [
    mockContactAddress({
      id: "address-ben",
      currencyId: "ethereum",
      label: "Ethereum",
      address: contactAddress,
    }),
  ],
  deviceCredentials: mockDeviceContactGroupCredentials(),
});

const me = mockMeContact({
  name: "Contact myself",
  addresses: [
    mockContactAddress({
      id: "address-me",
      currencyId: "ethereum",
      label: "Ethereum",
      address: meAddress,
    }),
  ],
});

const renderViewModel = (
  address: string,
  currencyId: string | undefined,
  contactsEnabled = true,
  contacts: Contact[] = [ben, me],
  excludedCurrencyIds: string[] = [],
) =>
  renderHook(() => useOperationDetailsContactViewModel(address, currencyId), {
    overrideInitialState: withFlagOverrides(
      {
        lwmContacts: {
          enabled: contactsEnabled,
          params: { newBadge: false, excludedCurrencyIds },
        },
      },
      state => ({ ...state, contacts: { ...state.contacts, contacts } }),
    ),
  });

describe("useOperationDetailsContactViewModel", () => {
  it("should name a counterparty saved in the contact list", () => {
    const { result } = renderViewModel(contactAddress, "ethereum");

    expect(result.current).toMatchObject({
      name: "Ben",
      rawName: "Ben",
      isMe: false,
      contactId: "contact-ben",
    });
  });

  it("should show a contact added after the transaction for the same address", () => {
    const { result, store } = renderViewModel(contactAddress, "ethereum", true, []);

    expect(result.current).toBeUndefined();

    act(() => {
      store.dispatch(addContact(ben));
    });

    expect(result.current?.name).toBe("Ben");
  });

  it("should format the Me contact with the Me display name", () => {
    const { result } = renderViewModel(meAddress, "ethereum");

    expect(result.current).toMatchObject({ rawName: "Contact myself", isMe: true });
    expect(result.current?.name).toContain("Contact myself");
  });

  it("should return nothing when the address is not in the contact list", () => {
    const { result } = renderViewModel("0xdeadbeef00000000000000000000000000000000", "ethereum");

    expect(result.current).toBeUndefined();
  });

  it("should return nothing when the address matches a contact on another network", () => {
    const { result } = renderViewModel(contactAddress, "polygon");

    expect(result.current).toBeUndefined();
  });

  it("should ignore the contact list when lwmContacts is disabled", () => {
    const { result } = renderViewModel(contactAddress, "ethereum", false);

    expect(result.current).toBeUndefined();
  });

  it("should return nothing when the currency is excluded from contacts", () => {
    const { result } = renderViewModel(contactAddress, "ethereum", true, [ben, me], ["ethereum"]);

    expect(result.current).toBeUndefined();
  });
});
