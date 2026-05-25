import React from "react";
import { render, screen } from "tests/testSetup";
import { ContactMenu } from "../components/ContactMenu";

describe("ContactMenu", () => {
  it("renders the trigger and keeps the menu closed by default", () => {
    render(<ContactMenu />);
    expect(screen.getByTestId("contacts-management-overflow")).toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-edit"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-contact-menu-delete"),
    ).not.toBeInTheDocument();
  });

  it("opens the popover with Edit + Delete items when the trigger is clicked", async () => {
    const { user } = render(<ContactMenu />);

    await user.click(screen.getByTestId("contacts-management-overflow"));

    expect(screen.getByTestId("contacts-management-contact-menu-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-contact-menu-delete")).toBeInTheDocument();
    expect(screen.getByText("Edit contact")).toBeInTheDocument();
    expect(screen.getByText("Delete contact")).toBeInTheDocument();
  });

  it("does not throw when a menu item is clicked (items are inert in L4)", async () => {
    const { user } = render(<ContactMenu />);

    await user.click(screen.getByTestId("contacts-management-overflow"));
    await user.click(screen.getByTestId("contacts-management-contact-menu-edit"));
    // No throw, no callback expected — just rendering hover/pressed
    // states. The Popover closes on the click; reopening it for the
    // Delete item happens via the same trigger path, no need to
    // re-test here.
  });
});
