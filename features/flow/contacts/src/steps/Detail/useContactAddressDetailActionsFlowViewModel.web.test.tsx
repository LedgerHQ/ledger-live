import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  ContactAddressIdSchema,
  contactsSlice,
  type ContactAddressId,
} from "@domain/entity-contact";
import {
  mockContactAddress,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../../platform/contactSignerValidationPort";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import { useContactAddressDetailActionsFlowViewModel } from "./useContactAddressDetailActionsFlowViewModel";

function createPorts(
  overrides: Partial<ContactAddressDetailActionsPorts> = {},
): ContactAddressDetailActionsPorts {
  return {
    edit: {
      updateAddress: jest.fn().mockResolvedValue(mockContactAddress()),
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

describe("useContactAddressDetailActionsFlowViewModel", () => {
  it("should open the edit dialog", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should always require the device and approve the save without an intermediate dialog", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });

    expect(result.current.isSignerRequiredForEdit).toBe(true);

    await act(async () => {
      await expect(result.current.requestSaveApproval()).resolves.toBe(true);
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should open the signer mismatch dialog when validation fails", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts({ signerValidation: mismatchPort }),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });

    await act(async () => {
      await expect(result.current.requestSaveApproval()).resolves.toBe(false);
    });

    expect(result.current.editUiState).toBe("signer-mismatch");
  });

  it("should return to the edit dialog when connecting a different device", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts({ signerValidation: mismatchPort }),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onEditPress();
    });
    await act(async () => {
      await result.current.requestSaveApproval();
    });

    expect(result.current.editUiState).toBe("signer-mismatch");

    act(() => {
      result.current.onConnectDifferentDevice();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should invoke onSend with the send intent", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const onSend = jest.fn();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts(),
          onSend,
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onSendPress();
    });

    expect(onSend).toHaveBeenCalledWith({
      type: "send-address",
      contactId: contact.id,
      addressId: address.id,
      currencyId: address.currencyId,
      address: address.address,
    });
  });

  it("should open delete state without signer validation", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const getExpectedSignerId = jest
      .fn()
      .mockRejectedValue(new Error("signer should not be checked"));
    const getCurrentSignerId = jest
      .fn()
      .mockRejectedValue(new Error("signer should not be checked"));
    const signerValidation: ContactSignerValidationPort = {
      getExpectedSignerId,
      getCurrentSignerId,
    };
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts({ signerValidation }),
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onDeletePress();
    });

    expect(result.current.editUiState).toBe("closed");
    expect(result.current.deleteLifecycle).toEqual({
      status: "open",
      contactId: contact.id,
      addressId: address.id,
    });
    expect(getExpectedSignerId).not.toHaveBeenCalled();
    expect(getCurrentSignerId).not.toHaveBeenCalled();
  });

  it("should delete an address and close the detail dialog on success", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const onCloseAddressDetail = jest.fn();
    const deleteAddress = jest.fn().mockResolvedValue(undefined);
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: address.id,
          ports: createPorts({ deletion: { deleteAddress } }),
          onCloseAddressDetail,
        }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.onDeletePress();
    });

    expect(result.current.deleteLifecycle).toEqual({
      status: "open",
      contactId: contact.id,
      addressId: address.id,
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteAddress).toHaveBeenCalledWith({
      contactId: contact.id,
      addressId: address.id,
    });
    expect(onCloseAddressDetail).toHaveBeenCalledTimes(1);
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });
    expect(result.current.isDeleting).toBe(false);
  });

  it("should reset edit and delete state when address selection is cleared", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result, rerender } = renderHook<
      ReturnType<typeof useContactAddressDetailActionsFlowViewModel>,
      { addressId: ContactAddressId | undefined }
    >(
      ({ addressId }: { addressId: ContactAddressId | undefined }) =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId,
          ports: createPorts(),
        }),
      {
        wrapper: Wrapper,
        initialProps: { addressId: address.id },
      },
    );

    act(() => {
      result.current.onEditPress();
    });

    expect(result.current.editUiState).toBe("edit-open");

    rerender({ addressId: undefined });

    expect(result.current.editUiState).toBe("closed");
    expect(result.current.canSend).toBe(false);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canDelete).toBe(false);
  });

  it("should disable send and edit when the address is not found", () => {
    const contact = mockContactWithAddress();
    const missingAddressId = ContactAddressIdSchema.parse("address-missing");
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetailActionsFlowViewModel({
          contactId: contact.id,
          addressId: missingAddressId,
          ports: createPorts(),
        }),
      { wrapper: Wrapper },
    );

    expect(result.current.canSend).toBe(false);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canDelete).toBe(true);
  });
});
