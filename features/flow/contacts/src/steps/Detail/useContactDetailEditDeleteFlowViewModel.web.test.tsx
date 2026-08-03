import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import type { ContactDetailActionsPorts } from "./model/ports";
import { useContactDetailEditDeleteFlowViewModel } from "./useContactDetailEditDeleteFlowViewModel";

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

describe("useContactDetailEditDeleteFlowViewModel", () => {
  it("should open the edit dialog directly when no signer is required", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });

    expect(result.current.editUiState).toBe("edit-open");
    expect(result.current.isActionsMenuOpen).toBe(false);
  });

  it("should open the signer dialog when editing a contact with addresses", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });

    expect(result.current.editUiState).toBe("signer-open");

    act(() => {
      result.current.onSignerConfirm();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should prevent deleting the Me contact", () => {
    const meContact = mockMeContact();
    const Wrapper = makeWrapper([meContact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: meContact.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    expect(result.current.canDelete).toBe(false);
  });

  it("should open delete confirmation and notify success after delete", async () => {
    const contact = mockContact();
    const onDeleteSuccess = jest.fn();
    const deleteContact = jest.fn().mockResolvedValue(undefined);
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
          ports: createPorts({ deletion: { deleteContact } }),
          onDeleteSuccess,
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onDeletePress();
    });

    expect(result.current.deleteLifecycle).toEqual({ status: "open", contactId: contact.id });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteContact).toHaveBeenCalledWith(contact.id);
    expect(onDeleteSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });
    expect(result.current.isDeleting).toBe(false);
  });
});
