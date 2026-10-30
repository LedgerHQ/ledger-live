import React from "react";
import { render, screen, within } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { AddContactDialogViewModel } from "../..";
import { ContactsAddContactDialog } from "./ContactsAddContactDialog";

function createProps(
  overrides: Partial<AddContactDialogViewModel> = {},
): AddContactDialogViewModel {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    avatarInitial: "",
    invalidNameError: null,
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    reset: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}

describe("ContactsAddContactDialog", () => {
  it("should render the add contact form inside the dialog while open", () => {
    render(<ContactsAddContactDialog {...createProps({ draftName: "Ada" })} />, {
      wrapper: I18nTestProvider,
    });

    const dialog = screen.getByTestId("contacts-add-contact-dialog");

    expect(dialog).toBeVisible();
    expect(within(dialog).getByTestId("contacts-add-contact-name-input")).toHaveValue("Ada");
    expect(within(dialog).getByTestId("contacts-add-contact-save")).toBeDisabled();
  });

  it("should render nothing while closed", () => {
    render(<ContactsAddContactDialog {...createProps({ isOpen: false })} />, {
      wrapper: I18nTestProvider,
    });

    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
  });
});
