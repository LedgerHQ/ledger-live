import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createContactDetailLedgerWalletAccountsIntent } from "./model/contactDetailSharedState";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import type { ContactDetailLabels } from "./types";
import { ContactDetailView } from "./ContactDetailView.web";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  addExternalAddress: "Add external address",
  emptyMeTitle: "No saved addresses for you",
  emptyContactTitle: name => `No saved addresses for ${name}`,
  emptyMeDescription: "Save your wallet addresses to receive crypto by name next time.",
  emptyContactDescription: () => "Save their wallet addresses to send to them by name next time",
  formatMeDisplayName: name => `${name} (Me)`,
  formatAddressCount: count => `${count} address`,
};

const onAddAddress = () => undefined;

const defaultProps = {
  labels,
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
};

describe("ContactDetailView", () => {
  it("should render the Me empty state", () => {
    render(<ContactDetailView {...defaultProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(screen.getByText("Add external address")).toBeInTheDocument();
    expect(screen.getByText("No saved addresses for you")).toBeInTheDocument();
    expect(
      screen.getByText("Save your wallet addresses to receive crypto by name next time."),
    ).toBeInTheDocument();
  });

  it("should render a custom Me display name with the Me suffix", () => {
    render(<ContactDetailView {...defaultProps} contact={mockMeContact({ name: "Maxime" })} />);

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Maxime (Me)");
  });

  it("should render a saved contact empty state", () => {
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockContact({ id: "contact-benoit", name: "Benoit" })}
      />,
    );

    expect(screen.getByTestId("contacts-detail-avatar")).toBeInTheDocument();
    expect(screen.getByText("Benoit")).toBeInTheDocument();
    expect(screen.getByText("No saved addresses for Benoit")).toBeInTheDocument();
    expect(
      screen.getByText("Save their wallet addresses to send to them by name next time"),
    ).toBeInTheDocument();
  });

  it("should preserve the saved contact name truncation styles", () => {
    const name = "Z".repeat(CONTACT_NAME_MAX_LENGTH);

    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockContact({ id: "contact-long-name", name })}
      />,
    );

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent(name);
    expect(screen.getByTestId("contacts-detail-name")).toHaveClass(
      "min-w-0",
      "max-w-full",
      "truncate",
    );
  });

  it("should render populated address rows when provided", () => {
    const contact = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [mockContactAddress()],
    });
    const address = contact.addresses[0]!;
    const handleAddressRowPress = jest.fn();

    render(
      <ContactDetailView
        {...defaultProps}
        contact={contact}
        addressGroups={[
          {
            networkId: getCryptoCurrencyById("ethereum").id,
            networkName: getCryptoCurrencyById("ethereum").name,
            networkTicker: getCryptoCurrencyById("ethereum").ticker,
            rows: [
              {
                addressId: address.id,
                label: address.label,
                address: address.address,
                currencyId: address.currencyId,
                intent: createContactDetailAddressRowIntent(contact.id, address.id),
              },
            ],
          },
        ]}
        onAddressRowPress={handleAddressRowPress}
      />,
    );

    expect(screen.getByTestId("contacts-detail-address-list")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
    expect(screen.getByTestId(`contacts-detail-address-row-${address.id}`)).toBeVisible();
    expect(screen.getByText("1 address")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-empty-state")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`contacts-detail-address-row-${address.id}`));

    expect(handleAddressRowPress).toHaveBeenCalledWith({
      type: "open-address-detail",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("should request adding an address when the action is pressed", () => {
    const handleAddAddress = jest.fn();
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockMeContact()}
        onAddAddress={handleAddAddress}
      />,
    );

    fireEvent.click(screen.getByTestId("contacts-detail-add-address"));

    expect(handleAddAddress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveAttribute(
      "aria-label",
      "Add external address",
    );
  });

  it("should compact the header when scrolling addresses and expand it at the top", () => {
    const contact = mockContact({
      id: "contact-scroll",
      name: "Benoit",
      addresses: [mockContactAddress()],
    });
    const address = contact.addresses[0]!;

    render(
      <ContactDetailView
        {...defaultProps}
        contact={contact}
        addressGroups={[
          {
            networkId: getCryptoCurrencyById("ethereum").id,
            networkName: getCryptoCurrencyById("ethereum").name,
            networkTicker: getCryptoCurrencyById("ethereum").ticker,
            rows: [
              {
                addressId: address.id,
                label: address.label,
                address: address.address,
                currencyId: address.currencyId,
                intent: createContactDetailAddressRowIntent(contact.id, address.id),
              },
            ],
          },
        ]}
        onAddressRowPress={jest.fn()}
      />,
    );

    const header = screen.getByTestId("contacts-detail-header");
    const addressList = screen.getByTestId("contacts-detail-address-list");

    expect(header).toHaveAttribute("data-state", "expanded");

    fireEvent.scroll(addressList, { target: { scrollTop: 150 } });

    expect(header).toHaveAttribute("data-state", "expanded");

    fireEvent.scroll(addressList, { target: { scrollTop: 151 } });

    expect(header).toHaveAttribute("data-state", "collapsed");
    expect(screen.getByTestId("contacts-detail-name")).toHaveClass("heading-5-semi-bold");
    expect(screen.getByText("1 address")).toHaveClass("body-2");
    expect(screen.getByTestId("contacts-detail-add-address-icon")).toHaveAttribute(
      "aria-label",
      "Add address",
    );

    fireEvent.scroll(addressList, { target: { scrollTop: 0 } });

    expect(header).toHaveAttribute("data-state", "expanded");
    expect(screen.getByTestId("contacts-detail-name")).toHaveClass("heading-3-semi-bold");
    expect(screen.queryByTestId("contacts-detail-add-address-icon")).not.toBeInTheDocument();
  });

  it("should reset the expanded header and address list when changing contact", () => {
    const firstContact = mockContact({
      id: "contact-first",
      name: "Benoit",
      addresses: [mockContactAddress()],
    });
    const secondContact = mockContact({
      id: "contact-second",
      name: "David",
      addresses: [mockContactAddress()],
    });
    const createAddressGroups = (contact: typeof firstContact) => {
      const address = contact.addresses[0]!;
      return [
        {
          networkId: getCryptoCurrencyById("ethereum").id,
          networkName: getCryptoCurrencyById("ethereum").name,
          networkTicker: getCryptoCurrencyById("ethereum").ticker,
          rows: [
            {
              addressId: address.id,
              label: address.label,
              address: address.address,
              currencyId: address.currencyId,
              intent: createContactDetailAddressRowIntent(contact.id, address.id),
            },
          ],
        },
      ];
    };
    const { rerender } = render(
      <ContactDetailView
        {...defaultProps}
        contact={firstContact}
        addressGroups={createAddressGroups(firstContact)}
        onAddressRowPress={jest.fn()}
      />,
    );

    const firstAddressList = screen.getByTestId("contacts-detail-address-list");
    fireEvent.scroll(firstAddressList, { target: { scrollTop: 24 } });

    rerender(
      <ContactDetailView
        {...defaultProps}
        contact={secondContact}
        addressGroups={createAddressGroups(secondContact)}
        onAddressRowPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-detail-header")).toHaveAttribute("data-state", "expanded");
    expect(screen.getByTestId("contacts-detail-address-list")).not.toBe(firstAddressList);
  });

  it("should keep detail actions available after the header compacts", () => {
    const contact = mockContact({
      id: "contact-actions",
      name: "Benoit",
      addresses: [mockContactAddress()],
    });
    const address = contact.addresses[0]!;
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onCompactAddAddress = jest.fn();

    render(
      <ContactDetailView
        {...defaultProps}
        contact={contact}
        onAddAddress={onCompactAddAddress}
        addressGroups={[
          {
            networkId: getCryptoCurrencyById("ethereum").id,
            networkName: getCryptoCurrencyById("ethereum").name,
            networkTicker: getCryptoCurrencyById("ethereum").ticker,
            rows: [
              {
                addressId: address.id,
                label: address.label,
                address: address.address,
                currencyId: address.currencyId,
                intent: createContactDetailAddressRowIntent(contact.id, address.id),
              },
            ],
          },
        ]}
        onAddressRowPress={jest.fn()}
        detailActions={{
          canDelete: true,
          labels: { editContact: "Edit contact", deleteContact: "Delete contact" },
          onEdit,
          onDelete,
        }}
      />,
    );

    fireEvent.scroll(screen.getByTestId("contacts-detail-address-list"), {
      target: { scrollTop: 24 },
    });
    fireEvent.click(screen.getByTestId("contacts-detail-add-address"));
    fireEvent.click(screen.getByTestId("contacts-detail-edit-action"));
    fireEvent.click(screen.getByTestId("contacts-detail-delete-action"));

    expect(onCompactAddAddress).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should render the Ledger Wallet addresses entry for Me", () => {
    const handleLedgerWalletAccountsPress = jest.fn();

    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockMeContact()}
        labels={{ ...labels, ledgerWalletAddresses: "Ledger Wallet addresses" }}
        ledgerWalletAccountsIntent={createContactDetailLedgerWalletAccountsIntent(mockMeContact())}
        onLedgerWalletAccountsPress={handleLedgerWalletAccountsPress}
      />,
    );

    expect(screen.getByTestId("contacts-detail-ledger-wallet-addresses")).toHaveTextContent(
      "Ledger Wallet addresses",
    );

    fireEvent.click(screen.getByTestId("contacts-detail-ledger-wallet-addresses"));

    expect(handleLedgerWalletAccountsPress).toHaveBeenCalledWith({
      type: "open-ledger-wallet-accounts",
    });
  });

  it("should not render the Ledger Wallet addresses entry for saved contacts", () => {
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockContact({ id: "contact-benoit", name: "Benoit" })}
        labels={{ ...labels, ledgerWalletAddresses: "Ledger Wallet addresses" }}
        ledgerWalletAccountsIntent={undefined}
        onLedgerWalletAccountsPress={() => undefined}
      />,
    );

    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).not.toBeInTheDocument();
  });
});
