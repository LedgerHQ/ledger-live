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

  it("shows the contact name, scope label, full untruncated address, and 3 action tiles", () => {
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

    // The full address must be present, NOT the 6+8 truncated form.
    const fullAddress = screen.getByTestId("contacts-management-address-full");
    expect(fullAddress).toHaveTextContent(entry.addressHex);

    // QR + 3 action tiles.
    expect(screen.getByTestId("contacts-management-address-qr")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-send")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-edit")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-address-dialog-delete")).toBeInTheDocument();
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
    await user.click(screen.getByTestId("contacts-management-address-dialog-edit"));
    await user.click(screen.getByTestId("contacts-management-address-dialog-delete"));

    expect(screen.getByTestId("contacts-management-address-dialog-delete")).toBeInTheDocument();
  });
});
