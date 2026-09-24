import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createMeDisplayNameFormatter } from "@features/platform-contacts";
import { createContactDetailLedgerWalletAccountsIntent } from "./model/contactDetailSharedState";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import type { ContactDetailLabels } from "./types";
import { ContactDetailView } from "./ContactDetailView.web";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  addYourAddress: "Add your address",
  emptyMeTitle: "No saved addresses for you",
  emptyContactTitle: name => `No saved addresses for ${name}`,
  emptyMeDescription: "Save your wallet addresses to receive crypto by name next time.",
  emptyContactDescription: () => "Save their wallet addresses to send to them by name next time",
  formatMeDisplayName: createMeDisplayNameFormatter("My addresses", name => `${name} (Me)`),
  formatAddressCount: count => `${count} address`,
};

const onAddAddress = () => undefined;

const defaultProps = {
  labels,
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
};

describe("ContactDetailView", () => {
  let ioCallback: IntersectionObserverCallback;

  beforeEach(() => {
    globalThis.IntersectionObserver = jest
      .fn()
      .mockImplementation((cb: IntersectionObserverCallback) => {
        ioCallback = cb;
        return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
      }) as unknown as typeof IntersectionObserver;
  });

  function fireIntersection(isIntersecting: boolean) {
    act(() => {
      ioCallback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  }

  it("should render the Me empty state", () => {
    render(<ContactDetailView {...defaultProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("My addresses");
    expect(screen.getByText("Add your address")).toBeInTheDocument();
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

    const addressList = screen.getByTestId("contacts-detail-address-list");
    expect(addressList).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
    expect(screen.getByTestId(`contacts-detail-address-row-${address.id}`)).toBeVisible();
    expect(within(addressList).getByText("1 address")).toBeVisible();
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
      "Add your address",
    );
  });

  it("should show the compact sticky bar when the header scrolls away and hide it when it returns", () => {
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

    const stickyBar = screen.getByTestId("contacts-detail-sticky-bar");

    // Initially the sticky bar is hidden and the expanded header is visible in the scroll area.
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(
      within(screen.getByTestId("contacts-detail-address-list")).getByTestId(
        "contacts-detail-header",
      ),
    ).toHaveAttribute("data-state", "expanded");

    // Header scrolls out of view → sticky bar slides in.
    fireIntersection(false);
    expect(stickyBar).not.toHaveAttribute("aria-hidden");
    expect(within(stickyBar).getByTestId("contacts-detail-header")).toHaveAttribute(
      "data-state",
      "collapsed",
    );
    expect(within(stickyBar).getByTestId("contacts-detail-name")).toHaveClass(
      "heading-5-semi-bold",
    );
    expect(within(stickyBar).getByText("1 address")).toHaveClass("body-2");
    expect(within(stickyBar).getByTestId("contacts-detail-add-address-icon")).toHaveAttribute(
      "aria-label",
      "Add address",
    );

    // Header scrolls back into view → sticky bar hides.
    fireIntersection(true);
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(
      within(screen.getByTestId("contacts-detail-address-list")).getByTestId(
        "contacts-detail-name",
      ),
    ).toHaveClass("heading-3-semi-bold");
    expect(
      within(screen.getByTestId("contacts-detail-address-list")).queryByTestId(
        "contacts-detail-add-address-icon",
      ),
    ).not.toBeInTheDocument();
  });

  it("should reset the sticky bar and address list when changing contact", () => {
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

    // Scroll past header on first contact so the sticky bar is visible.
    fireIntersection(false);
    expect(screen.getByTestId("contacts-detail-sticky-bar")).not.toHaveAttribute("aria-hidden");

    rerender(
      <ContactDetailView
        {...defaultProps}
        contact={secondContact}
        addressGroups={createAddressGroups(secondContact)}
        onAddressRowPress={jest.fn()}
      />,
    );

    // Sticky bar is instantly hidden on contact switch (no animation).
    expect(screen.getByTestId("contacts-detail-sticky-bar")).toHaveAttribute("aria-hidden", "true");
    // Address list was remounted for the new contact.
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

    fireIntersection(false);

    const stickyBar = screen.getByTestId("contacts-detail-sticky-bar");
    fireEvent.click(within(stickyBar).getByTestId("contacts-detail-add-address"));
    fireEvent.click(within(stickyBar).getByTestId("contacts-detail-edit-action"));
    fireEvent.click(within(stickyBar).getByTestId("contacts-detail-delete-action"));

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
