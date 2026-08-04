import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsAddContactDialog } from "./ContactsAddContactDialog.web";
import type { ContactsAddContactDialogProps } from "./types";

function createViewModel(
  overrides: Partial<ContactsAddContactDialogProps> = {}
): ContactsAddContactDialogProps {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    avatarInitial: "",
    invalidNameError: null,
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer:
        "For privacy, avoid full names and surnames. Use a nickname or just a first name + initial, e.g. 'John S'.",
      confirmName: "Add contact",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]:
          "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]:
          "This contact name is already in use.",
      },
    },
    onClose: jest.fn(),
    onOpen: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddContactDialog", () => {
  it("should render the shared validation error and disable confirmation", () => {
    render(
      <ContactsAddContactDialog
        {...createViewModel({
          draftName: "Cédric",
          invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
        })}
      />
    );

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveValue(
      "Cédric"
    );
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();
  });

  it("should forward draft name changes to the parent", () => {
    const onDraftNameChange = jest.fn();

    render(
      <ContactsAddContactDialog
        {...createViewModel({
          draftName: "Ada",
          isConfirmEnabled: true,
          onDraftNameChange,
        })}
      />
    );

    fireEvent.change(screen.getByTestId("contacts-add-contact-name-input"), {
      target: { value: "Ada1" },
    });

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada1");
  });
});
