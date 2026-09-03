import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import {
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { createMockContactSignerValidationPort } from "../../platform/contactSignerValidationPort";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import { useContactAddressDetailActionsFlowBindings } from "./useContactAddressDetailActionsFlowBindings";

function createPorts(
  overrides: Partial<ContactAddressDetailActionsPorts> = {},
): ContactAddressDetailActionsPorts {
  return {
    edit: {
      updateAddress: jest.fn(),
    },
    deletion: {
      deleteAddress: jest.fn().mockResolvedValue(undefined),
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

describe("useContactAddressDetailActionsFlowBindings", () => {
  it("should open the rename address dialog with the current label", () => {
    const contact = mockContactWithAddress({ id: "contact-ben", name: "Ben" });
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowBindings({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.flow.onEditPress();
    });

    expect(result.current.flow.editUiState).toBe("edit-open");
    expect(result.current.renameViewModel.isOpen).toBe(true);
    expect(result.current.renameViewModel.draftLabel).toBe(address.label);
  });

  it("should exclude the current address label from duplicate validation", () => {
    const contact = mockContactWithMultipleAddresses({ id: "contact-ben", name: "Ben" });
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowBindings({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.flow.onEditPress();
    });

    expect(result.current.renameViewModel.isConfirmEnabled).toBe(false);
  });
});
