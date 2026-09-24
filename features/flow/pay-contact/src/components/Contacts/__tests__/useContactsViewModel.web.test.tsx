import { act, renderHook } from "@testing-library/react";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import type { ContactOperation } from "@features/platform-contacts";
import { useContactsViewModel } from "../useContactsViewModel";
import { makeAddContactProps, makeContactsProps, makeContactsWrapper } from "./shared";

function renderViewModel(
  contacts: Parameters<typeof makeContactsWrapper>[0],
  props = makeContactsProps(),
) {
  return renderHook(() => useContactsViewModel(props), {
    wrapper: makeContactsWrapper(contacts),
  });
}

describe("useContactsViewModel", () => {
  it("should be empty when the store holds no contact", () => {
    const { result } = renderViewModel([]);

    expect(result.current.isEmpty).toBe(true);
  });

  it("should be empty when the me contact is the only one", () => {
    const { result } = renderViewModel([mockMeContact()]);

    expect(result.current.isEmpty).toBe(true);
  });

  it("should exclude the me contact and expose every saved contact without a cap", () => {
    const savedContacts = Array.from({ length: 9 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );
    const { result } = renderViewModel([mockMeContact(), ...savedContacts]);

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.rows).toHaveLength(9);
    expect(result.current.rows.every(row => !row.contact.isMe)).toBe(true);
  });

  it("should order contacts by last sent-to, then last added", () => {
    const bobAddress = "0x1111111111111111111111111111111111111111";
    const bob = mockContactWithAddress({
      id: "contact-bob",
      name: "Bob",
      addresses: [mockContactAddress({ id: "addr-bob", address: bobAddress })],
    });
    const alice = mockContactWithAddress({
      id: "contact-alice",
      name: "Alice",
      addresses: [
        mockContactAddress({
          id: "addr-alice",
          address: "0x2222222222222222222222222222222222222222",
        }),
      ],
    });
    const sentToBob: ContactOperation[] = [
      {
        id: "op-bob",
        type: "OUT",
        recipients: [bobAddress],
        date: 1_700_000_000_000,
        currencyId: "ethereum",
      },
    ];
    const { result } = renderViewModel(
      [mockMeContact(), bob, alice],
      makeContactsProps({ operations: sentToBob }),
    );

    expect(result.current.rows.map(row => row.contact.name)).toEqual(["Bob", "Alice"]);
    expect(result.current.rows.map(row => row.transactionCount)).toEqual([1, 0]);
  });

  it("should count incoming and outgoing transactions in the table", () => {
    const address = "0x1111111111111111111111111111111111111111";
    const contact = mockContactWithAddress({
      id: "contact-bob",
      name: "Bob",
      addresses: [mockContactAddress({ id: "addr-bob", address })],
    });
    const operations: ContactOperation[] = [
      { id: "op-in", type: "IN", senders: [address], date: 1000, currencyId: "ethereum" },
      { id: "op-out", type: "OUT", recipients: [address], date: 2000, currencyId: "ethereum" },
    ];
    const { result } = renderViewModel(
      [mockMeContact(), contact],
      makeContactsProps({ operations }),
    );

    expect(result.current.rows.map(row => row.transactionCount)).toEqual([2]);
  });

  it("should request add contact with the dialog open handler", () => {
    const onRequestAddContact = jest.fn();
    const { result } = renderViewModel(
      [],
      makeContactsProps({ addContact: makeAddContactProps({ onRequestAddContact }) }),
    );

    act(() => {
      result.current.emptyState.onAddContact();
    });

    expect(onRequestAddContact).toHaveBeenCalledTimes(1);
    expect(onRequestAddContact).toHaveBeenCalledWith(result.current.addContactDialog.onOpen);
  });

  it("should open the add contact dialog when the host allows it", () => {
    const onRequestAddContact = jest.fn((onAllowed: () => void) => onAllowed());
    const { result } = renderViewModel(
      [],
      makeContactsProps({ addContact: makeAddContactProps({ onRequestAddContact }) }),
    );

    act(() => {
      result.current.emptyState.onAddContact();
    });

    expect(result.current.addContactDialog.isOpen).toBe(true);
  });
});
