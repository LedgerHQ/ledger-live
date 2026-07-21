import React, { useState } from "react";
import type { ContactsAddContactDrawerProps } from "@features/flow-contacts";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ContactsAddContactDrawerSheet } from "./ContactsAddContactDrawerSheet";

function createViewModel(
  overrides: Partial<ContactsAddContactDrawerProps> = {},
): ContactsAddContactDrawerProps {
  return {
    isOpen: true,
    isConfirmEnabled: false,
    isSaving: false,
    draftName: "",
    labels: {
      title: "Add contact",
      namePlaceholder: "Contact name",
      namingDisclaimer:
        "For privacy, avoid full names and surnames. Use a nickname or just a first name + initial, e.g. 'John S'.",
      confirmName: "Confirm name",
    },
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onDraftNameChange: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

function ControlledAddContactDrawerSheet() {
  const [draftName, setDraftName] = useState("");

  return (
    <ContactsAddContactDrawerSheet
      {...createViewModel({
        draftName,
        isConfirmEnabled: true,
        onDraftNameChange: setDraftName,
      })}
    />
  );
}

describe("ContactsAddContactDrawerSheet", () => {
  it("should render the name form with the Figma copy and character limit", () => {
    render(<ContactsAddContactDrawerSheet {...createViewModel()} />);

    expect(screen.getByText("Add contact")).toBeVisible();
    expect(screen.getByText(/For privacy, avoid full names and surnames/)).toBeVisible();
    expect(screen.getByText("0/32")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeDisabled();
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp("autoFocus", true);
  });

  it("should cap the contact name at 32 characters", async () => {
    const { user } = render(<ControlledAddContactDrawerSheet />);
    const name = "a".repeat(33);

    await user.type(screen.getByTestId("contacts-add-contact-name-input"), name);

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp(
      "value",
      "a".repeat(32),
    );
    expect(screen.getByText("32/32")).toBeVisible();
  });

  it("should expose the edited name, enable confirmation, and close the drawer", async () => {
    const onClose = jest.fn();
    const onDraftNameChange = jest.fn();
    const onConfirm = jest.fn();
    const { rerender, user } = render(
      <ContactsAddContactDrawerSheet
        {...createViewModel({ onClose, onDraftNameChange, onConfirm })}
      />,
    );

    fireEvent.changeText(screen.getByTestId("contacts-add-contact-name-input"), "Ada");
    expect(onDraftNameChange).toHaveBeenCalledWith("Ada");

    rerender(
      <ContactsAddContactDrawerSheet
        {...createViewModel({
          draftName: "Ada",
          isConfirmEnabled: true,
          onClose,
          onDraftNameChange,
          onConfirm,
        })}
      />,
    );

    expect(screen.getByText("3/32")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm name" })).toBeEnabled();

    await user.press(screen.getByTestId("bottom-sheet-header-close-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
