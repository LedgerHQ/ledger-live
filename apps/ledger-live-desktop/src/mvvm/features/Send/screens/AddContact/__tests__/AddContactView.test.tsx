/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { AddContactView } from "../AddContactView";

function renderAddContactView(props?: Partial<React.ComponentProps<typeof AddContactView>>) {
  return render(
    <AddContactView onAddNewContact={jest.fn()} onAddToExistingContact={jest.fn()} {...props} />,
  );
}

describe("AddContactView", () => {
  it("renders both add contact options", () => {
    renderAddContactView();

    expect(screen.getByTestId("send-add-contact-new")).toBeInTheDocument();
    expect(screen.getByTestId("send-add-contact-existing")).toBeInTheDocument();
  });

  it.each([
    ["send-add-contact-new", "onAddNewContact"],
    ["send-add-contact-existing", "onAddToExistingContact"],
  ] as const)("calls the %s handler when clicked", (testId, handlerName) => {
    const handler = jest.fn();
    renderAddContactView({ [handlerName]: handler });

    screen.getByTestId(testId).click();

    expect(handler).toHaveBeenCalled();
  });
});
