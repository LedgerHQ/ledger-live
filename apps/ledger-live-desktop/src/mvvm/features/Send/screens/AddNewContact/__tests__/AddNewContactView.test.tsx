/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import {
  INVALID_CONTACT_NAME_ERROR_NAME,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { AddNewContactView } from "../AddNewContactView";

const labels = {
  title: "Add contact",
  namePlaceholder: "Contact name",
  namingDisclaimer: "Use a nickname.",
  confirmName: "Add contact",
  nameValidationErrors: {
    [INVALID_CONTACT_NAME_ERROR_NAME]: "Invalid name",
    [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "Duplicate name",
  },
} as const;

describe("AddNewContactView", () => {
  it("should render the add contact content", () => {
    render(
      <AddNewContactView
        isConfirmEnabled
        isSaving={false}
        draftName="Benoit"
        avatarInitial="B"
        invalidNameError={null}
        labels={labels}
        onDraftNameChange={jest.fn()}
        onConfirm={jest.fn()}
        reset={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-add-new-contact-step")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveValue("Benoit");
    expect(screen.getByRole("button", { name: "Add contact" })).toBeEnabled();
  });
});
