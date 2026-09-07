import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactAddressValueSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsRenameAddressDialog } from ".";
import type { ContactsRenameAddressDialogProps } from "./types";

function createViewModel(
  overrides: Partial<ContactsRenameAddressDialogProps> = {},
): ContactsRenameAddressDialogProps {
  const address = ContactAddressValueSchema.parse("0x1234567890123456789012345678901234567890");

  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftLabel: "",
    invalidLabelError: null,
    addressEntry: {
      status: "valid",
      value: address,
      resolvedAddress: address,
      inputMethod: "manual",
    },
    labels: {
      title: "Edit address",
      inputLabel: "Address label",
      applyChanges: "Apply changes",
      labelValidationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Address label is invalid.",
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: "Address label is already in use.",
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: "Address label is too long.",
      },
      addressValidation: {
        addressPlaceholder: "Address",
        validatingAddress: "Validating address",
        validAddress: "Valid address",
        invalidAddress: "Invalid address",
        domainNotFound: "Domain not found",
        sanctionedAddress: "Sanctioned address",
        validationUnavailable: "Validation unavailable",
        ensDisclaimer: "ENS addresses are supported.",
      },
    },
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftLabelChange: jest.fn(),
    onAddressChange: jest.fn(),
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameAddressDialog", () => {
  it("should render the label validation error and disable confirmation", () => {
    render(
      <ContactsRenameAddressDialog
        {...createViewModel({
          draftLabel: "Treasury",
          invalidLabelError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
        })}
      />,
    );

    expect(screen.getByTestId("contacts-rename-address-input")).toHaveValue("Treasury");
    expect(screen.getByTestId("contacts-rename-address-input")).toHaveAttribute(
      "helpertext",
      "Address label is invalid.",
    );
    expect(screen.getByTestId("contacts-rename-address-confirm")).toBeDisabled();
  });

  it("should forward address label and confirmation actions", () => {
    const onDraftLabelChange = jest.fn();
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsRenameAddressDialog
        {...createViewModel({
          isConfirmEnabled: true,
          onDraftLabelChange,
          onConfirm,
        })}
      />,
    );

    fireEvent.change(screen.getByTestId("contacts-rename-address-input"), {
      target: { value: "Treasury" },
    });
    fireEvent.click(screen.getByTestId("contacts-rename-address-confirm"));

    expect(onDraftLabelChange).toHaveBeenCalledWith("Treasury");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
