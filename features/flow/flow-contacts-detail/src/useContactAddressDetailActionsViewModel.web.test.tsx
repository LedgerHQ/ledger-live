import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactAddressIdSchema, contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContactAddressDetailActionsViewModel } from "./useContactAddressDetailActionsViewModel";

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
      () => useContactAddressDetailActionsViewModel(contact.id, address.id),
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

  it("exposes an edit intent with a signer-required requirement when the address exists", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsViewModel(contact.id, address.id),
      { wrapper: Wrapper },
    );

    expect(result.current.editIntent).toEqual({
      type: "edit-address",
      contactId: contact.id,
      addressId: address.id,
      editRequirement: {
        type: "confirmation-required",
        reason: "contact-has-address",
      },
    });
    expect(result.current.isSignerRequiredForEdit).toBe(true);
  });

  it("exposes undefined send and edit intents when the address is not found", () => {
    const contact = mockContactWithAddress();
    const missingAddressId = ContactAddressIdSchema.parse("address-missing");
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsViewModel(contact.id, missingAddressId),
      { wrapper: Wrapper },
    );

    expect(result.current.sendIntent).toBeUndefined();
    expect(result.current.editIntent).toBeUndefined();
  });
});
