/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { AddNewContactView } from "../AddNewContactView";

describe("AddNewContactView", () => {
  it("should render the add contact content", () => {
    render(
      <AddNewContactView
        isConfirmEnabled
        isSaving={false}
        draftName="Benoit"
        avatarInitial="B"
        invalidNameError={null}
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
