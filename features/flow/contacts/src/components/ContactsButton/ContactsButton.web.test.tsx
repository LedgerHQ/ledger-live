import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactsButton } from "./ContactsButton";

describe("ContactsButton", () => {
  it("should render the Contacts card and invoke its action", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();

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

    await user.click(screen.getByTestId("my-wallet-contacts-button"));

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
