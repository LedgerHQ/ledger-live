import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import { AddContactView } from "../AddContactView";

describe("AddContactView", () => {
  it("should render both add contact options", () => {
    render(
      <AddContactView
        newContactLabel="Add a new contact"
        existingContactLabel="Add to an existing contact"
        onAddNewContact={jest.fn()}
        onAddToExistingContact={jest.fn()}
      />,
    );

    expect(screen.getByTestId("send-add-contact-new")).toBeVisible();
    expect(screen.getByTestId("send-add-contact-existing")).toBeVisible();
  });

  it.each([
    ["send-add-contact-new", "onAddNewContact"],
    ["send-add-contact-existing", "onAddToExistingContact"],
  ] as const)("should call %s when the matching row is pressed", async (testId, handlerName) => {
    const handler = jest.fn();
    const user = userEvent.setup();
    render(
      <AddContactView
        newContactLabel="Add a new contact"
        existingContactLabel="Add to an existing contact"
        onAddNewContact={handlerName === "onAddNewContact" ? handler : jest.fn()}
        onAddToExistingContact={handlerName === "onAddToExistingContact" ? handler : jest.fn()}
      />,
    );

    await user.press(screen.getByTestId(testId));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
