import { act, renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
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

  it("should not be empty when a saved contact exists", () => {
    const { result } = renderViewModel([
      mockMeContact(),
      mockContact({ id: "contact-ada", name: "Ada" }),
    ]);

    expect(result.current.isEmpty).toBe(false);
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
