import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactAddressIdSchema, contactsSlice } from "@domain/entity-contact";
import {
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import { useContactAddressDetailActionsViewModel } from "./useContactAddressDetailActionsViewModel";

function createPorts(
  overrides: Partial<ContactAddressDetailActionsPorts> = {},
): ContactAddressDetailActionsPorts {
  return {
    deletion: {
      deleteAddress: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

function makeWrapper(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}

describe("useContactAddressDetailActionsViewModel", () => {
  it("exposes a send intent when the address exists", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsViewModel(contact.id, address.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.sendIntent).toEqual({
      type: "send-address",
      contactId: contact.id,
      addressId: address.id,
      currencyId: address.currencyId,
      address: address.address,
    });
  });

  it("exposes an edit intent when the address exists", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsViewModel(contact.id, address.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.editIntent).toEqual({
      type: "edit-address",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("exposes undefined send and edit intents when the address is not found", () => {
    const contact = mockContactWithAddress();
    const missingAddressId = ContactAddressIdSchema.parse("address-missing");
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsViewModel(contact.id, missingAddressId, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.sendIntent).toBeUndefined();
    expect(result.current.editIntent).toBeUndefined();
  });

  it("exposes a delete intent for the selected address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsViewModel(contact.id, address.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.deleteIntent).toEqual({
      type: "delete-address",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("opens, cancels, and confirms delete through the mocked lifecycle", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const deleteAddress = jest.fn().mockResolvedValue(undefined);
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsViewModel(
          contact.id,
          address.id,
          createPorts({ deletion: { deleteAddress } }),
        ),
      { wrapper: Wrapper },
    );

    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });

    act(() => {
      result.current.openDelete();
    });
    expect(result.current.deleteLifecycle).toEqual({
      status: "open",
      contactId: contact.id,
      addressId: address.id,
    });

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });

    act(() => {
      result.current.openDelete();
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteAddress).toHaveBeenCalledWith({
      contactId: contact.id,
      addressId: address.id,
    });
    expect(result.current.deleteLifecycle).toEqual({
      status: "success",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("exposes an error lifecycle when delete confirmation fails", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsViewModel(
          contact.id,
          address.id,
          createPorts({
            deletion: {
              deleteAddress: jest.fn().mockRejectedValue(new Error("delete failed")),
            },
          }),
        ),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.openDelete();
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteLifecycle).toEqual({
      status: "error",
      contactId: contact.id,
      addressId: address.id,
    });
  });
});
