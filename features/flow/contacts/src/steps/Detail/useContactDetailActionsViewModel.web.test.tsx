import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { createMockContactSignerValidationPort } from "../../platform/contactSignerValidationPort";
import type { ContactDetailActionsPorts } from "./model/ports";
import { useContactDetailActionsViewModel } from "./useContactDetailActionsViewModel";

function createPorts(
  overrides: Partial<ContactDetailActionsPorts> = {},
): ContactDetailActionsPorts {
  return {
    edit: {
      renameContact: jest.fn(),
    },
    deletion: {
      deleteContact: jest.fn().mockResolvedValue(undefined),
    },
    signerValidation: createMockContactSignerValidationPort(),
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

describe("useContactDetailActionsViewModel", () => {
  it("exposes a direct edit intent when the contact has no addresses", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactDetailActionsViewModel(contact.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.editIntent).toEqual({
      type: "edit-contact",
      contactId: contact.id,
      editRequirement: {
        type: "direct",
        reason: "contact-has-no-address",
      },
      signerValidationLookup: undefined,
    });
    expect(result.current.isSignerRequiredForEdit).toBe(false);
  });

  it("exposes a signer-required edit state when the contact has addresses", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactDetailActionsViewModel(contact.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.editIntent).toMatchObject({
      type: "edit-contact",
      contactId: contact.id,
      editRequirement: {
        type: "confirmation-required",
        reason: "contact-has-address",
      },
      signerValidationLookup: {
        contactId: contact.id,
        addressId: contact.addresses[0]!.id,
      },
    });
    expect(result.current.isSignerRequiredForEdit).toBe(true);
  });
});
