import React from "react";
import { fireEvent, render as renderWithoutI18n, screen } from "@testing-library/react-native";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ContactsI18nTestProvider } from "@features/platform-contacts/testing";
import { createContactDetailLedgerWalletAccountsIntent } from "./model/contactDetailSharedState";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import { ContactDetailView } from "./ContactDetailView.native";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

const onAddAddress = () => undefined;
const onLedgerWalletAccountsPress = () => undefined;

const defaultProps = {
  onAddAddress,
};

const meDetailProps = {
  ...defaultProps,
  ledgerWalletAccountsIntent: createContactDetailLedgerWalletAccountsIntent(mockMeContact()),
  onLedgerWalletAccountsPress,
};

describe("ContactDetailPage", () => {
  it("should render the Me empty state", () => {
    render(<ContactDetailView {...meDetailProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByText("My addresses (Me)")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent(
      "contacts.addYourAddress",
    );
    expect(screen.getByTestId("contacts-detail-ledger-wallet-addresses")).toHaveTextContent(
      "contacts.detail.ledgerWalletAddresses",
    );
    expect(screen.getByText("contacts.detail.emptyState.meTitle")).toBeVisible();
    expect(screen.getByText("contacts.detail.emptyState.meDescription")).toBeVisible();
  });

  it("should render a custom Me display name with the Me suffix", () => {
    render(<ContactDetailView {...meDetailProps} contact={mockMeContact({ name: "Maxime" })} />);

    expect(screen.getByText("Maxime (Me)")).toBeVisible();
  });

  it("should render a saved contact empty state", () => {
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockContact({ id: "contact-benoit", name: "Benoit" })}
      />,
    );

    expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    expect(screen.getByText("Benoit")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent(
      "contacts.addAddress",
    );
    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
    expect(screen.getByText("contacts.detail.emptyState.contactTitle")).toBeVisible();
    expect(screen.getByText("contacts.detail.emptyState.contactDescription")).toBeVisible();
  });

  it("should hide the Ledger Wallet addresses entry without its intent", () => {
    render(<ContactDetailView contact={mockMeContact()} onAddAddress={onAddAddress} />);

    expect(screen.getByText("My addresses (Me)")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
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
    expect(screen.getByTestId("contacts-detail-address-count")).toHaveTextContent(
      "contacts.addressCount",
    );
    expect(screen.queryByTestId("contacts-detail-empty-state")).toBeNull();

    fireEvent.press(screen.getByTestId(`contacts-detail-address-row-${address.id}`));

    expect(handleAddressRowPress).toHaveBeenCalledWith({
      type: "open-address-detail",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("should request adding an address when the action is pressed", () => {
    const onAddAddress = jest.fn();
    render(
      <ContactDetailView
        {...meDetailProps}
        contact={mockMeContact()}
        onAddAddress={onAddAddress}
      />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-add-address"));

    expect(onAddAddress).toHaveBeenCalledTimes(1);
  });

  it("should request opening Ledger Wallet addresses for Me", () => {
    const handleLedgerWalletAccountsPress = jest.fn();
    render(
      <ContactDetailView
        {...meDetailProps}
        contact={mockMeContact()}
        onLedgerWalletAccountsPress={handleLedgerWalletAccountsPress}
      />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-ledger-wallet-addresses"));

    expect(handleLedgerWalletAccountsPress).toHaveBeenCalledWith({
      type: "open-ledger-wallet-accounts",
    });
  });
});
