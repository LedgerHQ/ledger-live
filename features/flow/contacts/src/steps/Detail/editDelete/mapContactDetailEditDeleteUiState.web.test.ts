import { act, renderHook } from "@testing-library/react";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { RenameContactDialogViewModel } from "@features/flow-contacts-edit-contact";
import { createMockContactSignerValidationPort } from "../../../platform/contactSignerValidationPort";
import { makeContactsWrapper } from "../__tests__/contactsStoreTestUtils";
import type { ContactDetailActionsPorts } from "../model/ports";
import { createContactDetailEditDeleteUiState } from "./mapContactDetailEditDeleteUiState";
import { resolveContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";
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

describe("createContactDetailEditDeleteUiState", () => {
  it("maps flow state to signer mismatch dialog props", async () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
    const mismatchPort = createMockContactSignerValidationPort({
      currentSignerId: "signer-b",
    });
    const labels = resolveContactDetailEditDeleteLabels({ t: key => key });
    const { result } = renderHook(
      () =>
        useContactDetailEditDeleteFlowViewModel({
          contactId: contact.id,
          ports: createPorts({ signerValidation: mismatchPort }),
        }),
      { wrapper: Wrapper },
    );
    const renameViewModel: RenameContactDialogViewModel = {
      isOpen: false,
      isSaving: false,
      draftName: contact.name,
      invalidNameError: null,
      isConfirmEnabled: true,
      onOpen: () => undefined,
      onClose: () => undefined,
      onDraftNameChange: () => undefined,
      onConfirm: async () => undefined,
    };

    act(() => {
      result.current.onEditPress();
    });
    await act(async () => {
      await result.current.requestSaveApproval();
    });

    const uiState = createContactDetailEditDeleteUiState(result.current, renameViewModel, labels);

    expect(uiState.rename.isDeviceRequired).toBe(true);
    expect(uiState.signerMismatch).toEqual({
      isOpen: true,
      labels: labels.signerMismatch,
      onConnectDifferentDevice: result.current.onConnectDifferentDevice,
      onCancel: result.current.onSignerMismatchCancel,
    });
  });
});
