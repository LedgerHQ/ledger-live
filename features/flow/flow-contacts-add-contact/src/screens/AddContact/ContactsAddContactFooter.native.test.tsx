import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsAddContactFooter } from "./ContactsAddContactFooter.native";
import type { ContactsAddContactFooterProps } from "./types";

function createProps(
  overrides: Partial<ContactsAddContactFooterProps> = {},
): ContactsAddContactFooterProps {
  return {
    isConfirmEnabled: false,
    isSaving: false,
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer: "Use a nickname or a first name and initial.",
      confirmName: "Save contact",
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: "Special characters are not allowed.",
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "This contact name is already in use.",
      },
    },
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsAddContactFooter", () => {
  it("should stay disabled until the draft name is valid", () => {
    render(<ContactsAddContactFooter {...createProps()} />);

    expect(screen.getByTestId("contacts-add-contact-save")).toHaveProp("disabled", true);
    expect(screen.getByText("Save contact")).toBeVisible();
  });

  it("should save the contact", () => {
    const onConfirm = jest.fn(async () => undefined);

    render(<ContactsAddContactFooter {...createProps({ isConfirmEnabled: true, onConfirm })} />);

    fireEvent.press(screen.getByTestId("contacts-add-contact-save"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show a loading state while saving", () => {
    render(<ContactsAddContactFooter {...createProps({ isSaving: true })} />);

    expect(screen.getByTestId("contacts-add-contact-save")).toHaveProp("loading", true);
  });
});
