import React from "react";
import { render, screen } from "tests/testSetup";
import { AddressRowMenu } from "../components/AddressRowMenu";

describe("AddressRowMenu", () => {
  it("renders the MoreHorizontal trigger by default and keeps the menu closed", () => {
    render(<AddressRowMenu />);

    expect(screen.getByTestId("contacts-management-address-actions")).toBeInTheDocument();
    // The four menu items only exist in the DOM once the popover opens.
    expect(screen.queryByTestId("contacts-management-address-menu-qr")).not.toBeInTheDocument();
  });

  it("opens the popover with the 4 action items when the trigger is clicked", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));

    expect(screen.getByTestId("contacts-management-address-menu-qr")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-send")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-delete")).toBeInTheDocument();
    expect(screen.getByText("See QR Code")).toBeInTheDocument();
    expect(screen.getByText("Send to this address")).toBeInTheDocument();
    expect(screen.getByText("Edit address")).toBeInTheDocument();
    expect(screen.getByText("Delete address")).toBeInTheDocument();
  });

  it("does not throw when a menu item is clicked (items are inert in L4)", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-qr"));

    // No assertion on side-effects — the click is intentionally a no-op
    // for L4. We just confirm the inert handler doesn't throw.
    expect(screen.getByText("See QR Code")).toBeInTheDocument();
  });
});
