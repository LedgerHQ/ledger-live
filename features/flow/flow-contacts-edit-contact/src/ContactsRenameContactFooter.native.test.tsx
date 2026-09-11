import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsRenameContactFooter } from ".";
import type { ContactsRenameContactFooterProps } from "./types";

function createProps(
  overrides: Partial<ContactsRenameContactFooterProps> = {},
): ContactsRenameContactFooterProps {
  return {
    isConfirmEnabled: false,
    isSaving: false,
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
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameContactFooter", () => {
  it("should stay disabled until the draft name is valid", () => {
    render(<ContactsRenameContactFooter {...createProps()} />);

    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("disabled", true);
    expect(screen.getByText("Apply changes")).toBeVisible();
  });

  it("should confirm the rename", () => {
    const onConfirm = jest.fn(async () => undefined);

    render(<ContactsRenameContactFooter {...createProps({ isConfirmEnabled: true, onConfirm })} />);

    fireEvent.press(screen.getByTestId("contacts-rename-contact-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show a loading state while saving", () => {
    render(<ContactsRenameContactFooter {...createProps({ isSaving: true })} />);

    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("loading", true);
  });
});
