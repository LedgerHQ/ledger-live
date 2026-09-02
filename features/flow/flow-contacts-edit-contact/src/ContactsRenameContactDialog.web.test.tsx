import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
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
    labels: {
      title: "Edit contact",
      namePlaceholder: "Contact name",
      namingDisclaimer: "Use a nickname or a first name and initial.",
      applyChanges: "Apply changes",
      confirmName: "Apply changes",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "This contact name is already in use.",
      },
    },
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

describe("ContactsRenameContactDialog", () => {
  it("renders the shared validation error and disables confirmation", () => {
    render(
      <ContactsRenameContactDialog
        {...createViewModel({
          draftName: "Cédric",
          invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
        })}
      />,
    );

    expect(screen.getByTestId("contacts-rename-contact-name-input")).toHaveValue("Cédric");
    expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeDisabled();
  });

  it("forwards draft name changes", () => {
    const onDraftNameChange = jest.fn();

    render(
      <ContactsRenameContactDialog
        {...createViewModel({
          draftName: "Ada",
          isConfirmEnabled: true,
          onDraftNameChange,
        })}
      />,
    );

    fireEvent.change(screen.getByTestId("contacts-rename-contact-name-input"), {
      target: { value: "Ada1" },
    });

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada1");
  });
});
