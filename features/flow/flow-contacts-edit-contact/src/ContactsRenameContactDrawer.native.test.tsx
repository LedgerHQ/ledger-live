import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { ContactsRenameContactDrawer } from ".";
import type { ContactsRenameContactDrawerProps } from "./types";

function createViewModel(
  overrides: Partial<ContactsRenameContactDrawerProps> = {},
): ContactsRenameContactDrawerProps {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    invalidNameError: null,
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
    onConfirm: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe("ContactsRenameContactDrawer", () => {
  it("should render the validation state and account for drawer insets", () => {
    const { toJSON } = render(
      <ContactsRenameContactDrawer
        {...createViewModel({
          draftName: "Ada",
          invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
          bottomInset: 8,
          keyboardInset: 300,
        })}
      />,
    );

    expect(screen.getByTestId("contacts-rename-contact-content")).toBeVisible();
    expect(screen.getByText("Edit contact")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-contact-name-input")).toHaveProp("value", "Ada");
    expect(screen.getByTestId("contacts-rename-contact-name-error")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );
    expect(screen.getByText("Special characters are not allowed.")).toBeVisible();
    expect(screen.getByText("3/32")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-contact-confirm")).toHaveProp("disabled", true);
    expect(toJSON()).toMatchObject({ props: { style: { paddingBottom: 332 } } });
  });

  it("should forward name and confirmation actions", () => {
    const onDraftNameChange = jest.fn();
    const onConfirm = jest.fn(async () => undefined);

    render(
      <ContactsRenameContactDrawer
        {...createViewModel({
          isConfirmEnabled: true,
          onDraftNameChange,
          onConfirm,
        })}
      />,
    );

    fireEvent.changeText(screen.getByTestId("contacts-rename-contact-name-input"), "Ada Lovelace");
    fireEvent.press(screen.getByTestId("contacts-rename-contact-confirm"));

    expect(onDraftNameChange).toHaveBeenCalledWith("Ada Lovelace");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should not render its content while closed", () => {
    render(<ContactsRenameContactDrawer {...createViewModel({ isOpen: false })} />);

    expect(screen.queryByTestId("contacts-rename-contact-content")).not.toBeOnTheScreen();
  });
});
