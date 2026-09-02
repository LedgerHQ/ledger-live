import { act, renderHook } from "@testing-library/react";
import {
  mockContact,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../../../platform/contactSignerValidationPort";
import { makeContactsWrapper } from "../__tests__/contactsStoreTestUtils";
import type { ContactDetailActionsPorts } from "../model/ports";
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
    signerValidation: createMockContactSignerValidationPort(),
    ...overrides,
  };
}

describe("useContactDetailEditDeleteFlowViewModel", () => {
  it("should open the edit dialog directly when no signer is required", () => {
    const contact = mockContact();
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
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

  it("should open the edit dialog without asking for the signer first", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
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
  });

  it("should approve the save without any intermediate dialog when the signer matches", async () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
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

    await act(async () => {
      await expect(result.current.requestSaveApproval()).resolves.toBe(true);
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should approve the save without a signer check when the contact has no address", async () => {
    const contact = mockContact();
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
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

    await act(async () => {
      await expect(result.current.requestSaveApproval()).resolves.toBe(true);
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should open the signer mismatch dialog when validation fails", async () => {
    const contact = mockContactWithAddress();
    const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
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
    const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
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

  it("should return to the edit dialog when the mismatch is cancelled", async () => {
    const contact = mockContactWithAddress();
    const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
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
      result.current.onSignerMismatchCancel();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should prevent deleting the Me contact", () => {
    const meContact = mockMeContact();
    const Wrapper = makeContactsWrapper([meContact]);
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
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
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
      result.current.openDelete();
    });

    expect(result.current.isActionsMenuOpen).toBe(false);
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
