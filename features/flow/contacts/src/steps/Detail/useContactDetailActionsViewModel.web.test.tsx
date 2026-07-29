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
    });
    expect(result.current.isSignerRequiredForEdit).toBe(true);
  });

  it("exposes a delete intent for the selected contact", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => useContactDetailActionsViewModel(contact.id, createPorts()),
      { wrapper: Wrapper },
    );

    expect(result.current.deleteIntent).toEqual({
      type: "delete-contact",
      contactId: contact.id,
    });
  });

  it("opens, cancels, and confirms delete through the mocked lifecycle", async () => {
    const contact = mockContact();
    const deleteContact = jest.fn().mockResolvedValue(undefined);
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailActionsViewModel(contact.id, createPorts({ deletion: { deleteContact } })),
      { wrapper: Wrapper },
    );

    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });

    act(() => {
      result.current.openDelete();
    });
    expect(result.current.deleteLifecycle).toEqual({ status: "open", contactId: contact.id });

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

    expect(deleteContact).toHaveBeenCalledWith(contact.id);
    expect(result.current.deleteLifecycle).toEqual({ status: "success", contactId: contact.id });
  });

  it("exposes an error lifecycle when delete confirmation fails", async () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailActionsViewModel(
          contact.id,
          createPorts({
            deletion: {
              deleteContact: jest.fn().mockRejectedValue(new Error("delete failed")),
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

    expect(result.current.deleteLifecycle).toEqual({ status: "error", contactId: contact.id });
  });
});
