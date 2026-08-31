import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { RenameContactDialogViewModel } from "@features/flow-contacts-edit-contact";
import {
  createMockContactSignerValidationPort,
  type ContactDetailActionsPorts,
  useContactDetailEditDeleteFlowViewModel,
} from "@features/flow-contacts-detail";
import { createContactDetailEditDeleteUiState } from "./mapContactDetailEditDeleteUiState";
import { resolveContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";

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

function makeContactsWrapper(
  contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"],
) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
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
      await result.current.onSignerConfirm();
    });

    const uiState = createContactDetailEditDeleteUiState(result.current, renameViewModel, labels);

    expect(uiState.signerMismatch).toEqual({
      isOpen: true,
      labels: labels.signerMismatch,
      onConnectDifferentDevice: result.current.onConnectDifferentDevice,
      onCancel: result.current.onSignerMismatchCancel,
    });
  });
});
