import React from "react";
import { render, screen } from "tests/testSetup";
import { AddressRowMenu } from "../components/AddressRowMenu";

describe("AddressRowMenu", () => {
  it("renders the MoreHorizontal trigger by default and keeps the menu closed", () => {
    render(<AddressRowMenu />);

    expect(screen.getByTestId("contacts-management-address-actions")).toBeInTheDocument();
    // The five menu items only exist in the DOM once the popover opens.
    expect(screen.queryByTestId("contacts-management-address-menu-qr")).not.toBeInTheDocument();
  });

  it("opens the popover with the 5 action items when the trigger is clicked", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));

    expect(screen.getByTestId("contacts-management-address-menu-qr")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-send")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-rename")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-menu-delete")).toBeInTheDocument();
    expect(screen.getByText("See QR Code")).toBeInTheDocument();
    expect(screen.getByText("Send to this address")).toBeInTheDocument();
    expect(screen.getByText("Rename address")).toBeInTheDocument();
    expect(screen.getByText("Edit address")).toBeInTheDocument();
    expect(screen.getByText("Delete address")).toBeInTheDocument();
  });

  it("renders Rename between Send and Edit (matches Figma 13909:3063 order)", async () => {
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));

    const items = screen.getAllByTestId(/^contacts-management-address-menu-/);
    const ids = items.map(el => el.getAttribute("data-testid"));
    expect(ids).toEqual([
      "contacts-management-address-menu-qr",
      "contacts-management-address-menu-send",
      "contacts-management-address-menu-rename",
      "contacts-management-address-menu-edit",
      "contacts-management-address-menu-delete",
    ]);
  });

  it("dismisses the popover when a menu item is clicked (items are inert in L4, only the dismiss runs)", async () => {
    // The L4.1 wiring will inject real handlers via props. We dismiss
    // first so any future handler that opens a dialog doesn't end up
    // rendering its overlay behind the still-visible menu — see the
    // ContactMenu fix for the rationale.
    const { user } = render(<AddressRowMenu />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    expect(screen.getByText("See QR Code")).toBeInTheDocument();

    await user.click(screen.getByTestId("contacts-management-address-menu-qr"));
    expect(screen.queryByText("See QR Code")).not.toBeInTheDocument();
  });

  it("fires the onEditAddress callback when 'Edit address' is clicked", async () => {
    const onEditAddress = jest.fn();
    const { user } = render(<AddressRowMenu onEditAddress={onEditAddress} />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-edit"));

    expect(onEditAddress).toHaveBeenCalledTimes(1);
    // Popover dismisses synchronously so the edit dialog the host
    // mounts in response doesn't render behind a stuck menu.
    expect(screen.queryByText("Edit address")).not.toBeInTheDocument();
  });

  it("fires the onRenameAddress callback when 'Rename address' is clicked", async () => {
    const onRenameAddress = jest.fn();
    const { user } = render(<AddressRowMenu onRenameAddress={onRenameAddress} />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-rename"));

    expect(onRenameAddress).toHaveBeenCalledTimes(1);
    // Popover dismisses synchronously so the rename dialog the host
    // mounts in response doesn't render behind a stuck menu.
    expect(screen.queryByText("Rename address")).not.toBeInTheDocument();
  });

  it("fires the onDeleteAddress callback when 'Delete address' is clicked", async () => {
    // Contract assertion: the host (AddressRow → ContactDetails) opens
    // the DeleteAddressDialog confirmation gate from this callback.
    const onDeleteAddress = jest.fn();
    const { user } = render(<AddressRowMenu onDeleteAddress={onDeleteAddress} />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-delete"));

    expect(onDeleteAddress).toHaveBeenCalledTimes(1);
    // Popover dismisses synchronously so the confirm dialog the host
    // mounts in response doesn't render behind a still-visible menu.
    expect(screen.queryByText("Delete address")).not.toBeInTheDocument();
  });

  it("fires the onShowQrCode callback when 'See QR Code' is clicked", async () => {
    // Contract assertion: the host (AddressRow) routes this handler to
    // the same `onSelect` that opens the address detail dialog when
    // the row body is clicked, so the menu entry and the row click
    // land on the same screen.
    const onShowQrCode = jest.fn();
    const { user } = render(<AddressRowMenu onShowQrCode={onShowQrCode} />);

    await user.click(screen.getByTestId("contacts-management-address-actions"));
    await user.click(screen.getByTestId("contacts-management-address-menu-qr"));

    expect(onShowQrCode).toHaveBeenCalledTimes(1);
    // And the popover dismisses synchronously so the dialog (which the
    // host will mount in response) doesn't sit behind a still-visible
    // menu overlay.
    expect(screen.queryByText("See QR Code")).not.toBeInTheDocument();
  });
});
