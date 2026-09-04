import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";
import {
  useContactAddressPickerViewModel,
  type UseContactAddressPickerViewModelParams,
} from "../useContactAddressPickerViewModel";

const resources: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      payTab: {
        contacts: {
          addressPicker: {
            title: "Select {{name}}'s address",
            addAddress: "Add address",
          },
        },
      },
    },
  },
};

const contact = mockContact({
  id: "contact-ada",
  name: "Ada",
  addresses: [mockContactAddress({ id: "address-eth", currencyId: "ethereum" })],
});

function renderViewModel(overrides: Partial<UseContactAddressPickerViewModelParams> = {}) {
  return renderHook(
    () => useContactAddressPickerViewModel({ onSelectAddress: jest.fn(), ...overrides }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <I18nTestProvider resources={resources}>{children}</I18nTestProvider>
      ),
    },
  );
}

describe("useContactAddressPickerViewModel", () => {
  it("is closed by default", () => {
    const { result } = renderViewModel();

    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
    expect(result.current.contactAddressPicker.groups).toEqual([]);
    expect(result.current.contactAddressPicker.title).toBe("");
  });

  it("opens with the selected contact", () => {
    const { result } = renderViewModel();

    act(() => result.current.open(contact));

    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(result.current.contactAddressPicker.title).toBe("Select Ada's address");
    expect(result.current.contactAddressPicker.groups.map(group => group.networkId)).toEqual([
      "ethereum",
    ]);
  });

  it("resets when closed", () => {
    const { result } = renderViewModel();

    act(() => result.current.open(contact));
    act(() => result.current.close());

    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
    expect(result.current.contactAddressPicker.groups).toEqual([]);
  });

  it("binds onAddNewAddress to the open contact", () => {
    const onAddNewAddress = jest.fn();
    const { result } = renderViewModel({ onAddNewAddress });

    expect(result.current.contactAddressPicker.onAddNewAddress).toBeUndefined();

    act(() => result.current.open(contact));
    act(() => result.current.contactAddressPicker.onAddNewAddress?.());

    expect(onAddNewAddress).toHaveBeenCalledTimes(1);
    expect(onAddNewAddress).toHaveBeenCalledWith(contact);
  });
});
