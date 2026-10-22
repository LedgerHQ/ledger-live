import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ContactAddressValueSchema,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
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
    isDeviceRequired: true,
    supportsDomain: true,
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
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("contacts-rename-address-input")).toHaveValue("Treasury");
    expect(screen.getByTestId("contacts-rename-address-input")).toHaveAttribute(
      "helpertext",
      "contacts.editAddress.invalidLabelError",
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
      { wrapper: I18nTestProvider },
    );

    fireEvent.change(screen.getByTestId("contacts-rename-address-input"), {
      target: { value: "Treasury" },
    });
    fireEvent.click(screen.getByTestId("contacts-rename-address-confirm"));

    expect(onDraftLabelChange).toHaveBeenCalledWith("Treasury");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
