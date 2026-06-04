import React from "react";
import { render, screen } from "tests/testSetup";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";
import { AddressDetailDialog } from "../components/AddressDetailDialog";

const buildEntry = (overrides: Partial<ContactEntry> = {}): ContactEntry => ({
  scope: "Main",
  addressHex: "0x39dG0a30922334455667788990aabbccddeeff00",
  hmacRestHex: "",
  derivationPath: "44'/60'/0'/0/0",
  chainId: 1,
  ...overrides,
});

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  name: "Benoit Lucet",
  groupHandleHex: "",
  hmacNameHex: "",
  entries: [],
  ...overrides,
});

describe("AddressDetailDialog", () => {
  it("renders nothing when `entry` is null", () => {
    render(
      <AddressDetailDialog
        open
        onOpenChange={jest.fn()}
        contact={buildContact()}
        entry={null}
      />,
    );

    expect(screen.queryByTestId("contacts-management-address-full")).not.toBeInTheDocument();
  });

  it("renders nothing when `open` is false", () => {
    render(
      <AddressDetailDialog
        open={false}
        onOpenChange={jest.fn()}
        contact={buildContact()}
        entry={buildEntry()}
      />,
    );

    expect(screen.queryByTestId("contacts-management-address-full")).not.toBeInTheDocument();
  });

  it("shows the contact name, network tag, scope label, full address, and 4 action tiles", () => {
    const entry = buildEntry({ scope: "Ethereum Main" });
    render(
      <AddressDetailDialog
        open
        onOpenChange={jest.fn()}
        contact={buildContact({ name: "Benoit Lucet" })}
        entry={entry}
      />,
    );

    // Dialog header carries the contact name (rendered multiple times in
    // Lumen's accessibility tree — title text + screen-reader heading).
    expect(screen.getAllByText("Benoit Lucet").length).toBeGreaterThan(0);
    expect(screen.getByText("Ethereum Main")).toBeInTheDocument();

    // Network tag — replaces the legacy chain text under the address.
    // The label resolves from `getChainInfo(1)` to "Ethereum".
    expect(
      screen.getByTestId("contacts-management-address-network-tag"),
    ).toBeInTheDocument();

    // The full address must be present, NOT the 6+8 truncated form.
    const fullAddress = screen.getByTestId("contacts-management-address-full");
    expect(fullAddress).toHaveTextContent(entry.addressHex);

    // QR + 4 action tiles (Send / Rename / Edit / Delete).
    expect(screen.getByTestId("contacts-management-address-qr")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-send")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-rename")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-delete")).toBeInTheDocument();
  });

  it("renders the action tiles in Figma 13844:10015 order (Send / Rename / Edit / Delete)", () => {
    render(
      <AddressDetailDialog
        open
        onOpenChange={jest.fn()}
        contact={buildContact()}
        entry={buildEntry()}
      />,
    );

    const tiles = screen.getAllByTestId(/^contacts-management-address-dialog-/);
    const ids = tiles.map(el => el.getAttribute("data-testid"));
    expect(ids).toEqual([
      "contacts-management-address-dialog-send",
      "contacts-management-address-dialog-rename",
      "contacts-management-address-dialog-edit",
      "contacts-management-address-dialog-delete",
    ]);
  });

  it("fires onDelete when the Delete tile is clicked (mirrors the row menu's delete path)", async () => {
    const onDelete = jest.fn();
    const { user } = render(
      <AddressDetailDialog
        open
        onOpenChange={jest.fn()}
        contact={buildContact()}
        entry={buildEntry()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTestId("contacts-management-address-dialog-delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not throw when an action tile is clicked (inert in L4)", async () => {
    const { user } = render(
      <AddressDetailDialog
        open
        onOpenChange={jest.fn()}
        contact={buildContact()}
        entry={buildEntry()}
      />,
    );

    await user.click(screen.getByTestId("contacts-management-address-dialog-send"));
    await user.click(screen.getByTestId("contacts-management-address-dialog-rename"));
    await user.click(screen.getByTestId("contacts-management-address-dialog-edit"));
    await user.click(screen.getByTestId("contacts-management-address-dialog-delete"));

    expect(screen.getByTestId("contacts-management-address-dialog-delete")).toBeInTheDocument();
  });
});
