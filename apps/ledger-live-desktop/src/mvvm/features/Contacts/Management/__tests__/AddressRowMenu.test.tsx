import React from "react";
import { render, screen } from "tests/testSetup";
import { AddressRowMenu } from "../components/AddressRowMenu";

describe("AddressRowMenu", () => {
  it("renders the MoreHorizontal trigger by default and keeps the menu closed", () => {
    render(<AddressRowMenu />);

    expect(screen.getByTestId("contacts-management-address-actions")).toBeInTheDocument();
    // The four menu items only exist in the DOM once the popover opens.
    expect(screen.queryByTestId("contacts-management-address-menu-copy")).not.toBeInTheDocument();
  });

  it("opens the popover with the 4 action items when the trigger is clicked", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));

    expect(screen.getByTestId("contacts-management-address-menu-copy")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-edit-label")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-edit-address")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-remove")).toBeInTheDocument();
    expect(screen.getByText("Copy address")).toBeInTheDocument();
    expect(screen.getByText("Edit label")).toBeInTheDocument();
    expect(screen.getByText("Edit address")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("does not throw when a menu item is clicked (items are inert in L4)", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-copy"));

    // No assertion on side-effects — the click is intentionally a no-op
    // for L4. We just confirm the inert handler doesn't throw.
    expect(screen.getByText("Copy address")).toBeInTheDocument();
  });
});
