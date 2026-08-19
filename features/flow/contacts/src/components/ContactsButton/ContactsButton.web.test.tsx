import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContactsButton } from "./ContactsButton.web";

describe("ContactsButton", () => {
  it("should render the Contacts card and invoke its action", () => {
    const onClick = jest.fn();

    render(
      <ContactsButton
        title="Contacts"
        description="Save and manage external wallet addresses."
        onClick={onClick}
      />,
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.getByText("Contacts")).toBeVisible();
    expect(screen.getByText("Save and manage external wallet addresses.")).toBeVisible();

    fireEvent.click(screen.getByTestId("my-wallet-contacts-button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should display the New badge when it is provided", () => {
    render(
      <ContactsButton
        title="Contacts"
        description="Save and manage external wallet addresses."
        newBadgeLabel="New"
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-button-new-badge")).toBeVisible();
  });
});
