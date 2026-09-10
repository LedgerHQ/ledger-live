import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsRenameContactDialog } from ".";
import type { ContactsRenameContactDialogProps } from "./types";

function createViewModel(
  overrides: Partial<ContactsRenameContactDialogProps> = {},
): ContactsRenameContactDialogProps {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    invalidNameError: null,
    isDeviceRequired: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

function renderDialog(props: ContactsRenameContactDialogProps) {
  return render(
    <I18nTestProvider>
      <ContactsRenameContactDialog {...props} />
    </I18nTestProvider>,
  );
}

describe("ContactsRenameContactDialog", () => {
  it("renders the shared validation error and disables confirmation", () => {
    renderDialog(
      createViewModel({
        draftName: "Cédric",
        invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
      }),
    );

    expect(screen.getByTestId("contacts-rename-contact-name-input")).toHaveValue("Cédric");
    expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeDisabled();
  });

  it("forwards draft name changes", () => {
    const onDraftNameChange = jest.fn();

    renderDialog(
      createViewModel({
        draftName: "Ada",
        isConfirmEnabled: true,
        onDraftNameChange,
      }),
    );

    fireEvent.change(screen.getByTestId("contacts-rename-contact-name-input"), {
      target: { value: "Ada1" },
    });

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada1");
  });
});
