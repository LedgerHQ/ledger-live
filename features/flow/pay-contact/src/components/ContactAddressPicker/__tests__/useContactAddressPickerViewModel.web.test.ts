import { act, renderHook } from "@testing-library/react";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { useContactAddressPickerViewModel } from "../useContactAddressPickerViewModel.web";

describe("useContactAddressPickerViewModel", () => {
  it("starts closed with no contact", () => {
    const { result } = renderHook(() =>
      useContactAddressPickerViewModel({ onSelectAddress: jest.fn() }),
    );

    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("opens with the pressed contact and closes clearing it", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() =>
      useContactAddressPickerViewModel({ onSelectAddress: jest.fn() }),
    );

    act(() => result.current.open(contact));
    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(result.current.contactAddressPicker.contact).toBe(contact);

    act(() => result.current.contactAddressPicker.onClose());
    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("passes onSelectAddress and onAddNewContact through", () => {
    const onSelectAddress = jest.fn();
    const onAddNewContact = jest.fn();

    const { result } = renderHook(() =>
      useContactAddressPickerViewModel({ onSelectAddress, onAddNewContact }),
    );

    expect(result.current.contactAddressPicker.onSelectAddress).toBe(onSelectAddress);
    expect(result.current.contactAddressPicker.onAddNewContact).toBe(onAddNewContact);
  });
});
