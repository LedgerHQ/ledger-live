import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";
import { createContactDetailLedgerWalletAccountsIntent } from "./model/contactDetailSharedState";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import { ContactDetailView } from "./ContactDetailView.native";

const resources: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      contacts: {
        addAddress: "Add address",
        addYourAddress: "Add your address",
        addressCount_zero: "0 address",
        addressCount_one: "{{count}} address",
        addressCount_other: "{{count}} addresses",
        detail: {
          emptyState: {
            meTitle: "Save your own addresses",
            contactTitle: "No saved addresses for {{name}}",
            meDescription: "Save external addresses for Me.",
            contactDescription: "Save their wallet addresses to send to them by name next time",
          },
          ledgerWalletAddresses: "Ledger Wallet addresses",
          meDisplayName: "{{name}} (Me)",
        },
        me: { myAddresses: "My addresses" },
      },
    },
  },
};

const onAddAddress = () => undefined;
const onLedgerWalletAccountsPress = () => undefined;

const defaultProps = {
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
};

const meDetailProps = {
  ...defaultProps,
  ledgerWalletAccountsIntent: createContactDetailLedgerWalletAccountsIntent(mockMeContact()),
  onLedgerWalletAccountsPress,
};

function renderContactDetailView(
  props: React.ComponentProps<typeof ContactDetailView>,
): ReturnType<typeof render> {
  return render(
    <I18nTestProvider resources={resources}>
      <ContactDetailView {...props} />
    </I18nTestProvider>,
  );
}

describe("ContactDetailPage", () => {
  it("should render the Me empty state", () => {
    renderContactDetailView({ ...meDetailProps, contact: mockMeContact() });

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByText("My addresses")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add your address");
    expect(screen.getByTestId("contacts-detail-ledger-wallet-addresses")).toHaveTextContent(
      "Ledger Wallet addresses",
    );
    expect(screen.getByText("Save your own addresses")).toBeVisible();
    expect(screen.getByText("Save external addresses for Me.")).toBeVisible();
  });

  it("should render a custom Me display name with the Me suffix", () => {
    renderContactDetailView({
      ...meDetailProps,
      contact: mockMeContact({ name: "Maxime" }),
    });

    expect(screen.getByText("Maxime (Me)")).toBeVisible();
  });

  it("should render a saved contact empty state", () => {
    renderContactDetailView({
      ...defaultProps,
      contact: mockContact({ id: "contact-benoit", name: "Benoit" }),
    });

    expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    expect(screen.getByText("Benoit")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add address");
    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
    expect(screen.getByText("No saved addresses for Benoit")).toBeVisible();
    expect(
      screen.getByText("Save their wallet addresses to send to them by name next time"),
    ).toBeVisible();
  });

  it("should render populated address rows when provided", () => {
    const contact = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [mockContactAddress()],
    });
    const address = contact.addresses[0]!;
    const handleAddressRowPress = jest.fn();

    renderContactDetailView({
      ...defaultProps,
      contact,
      addressGroups: [
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
      ],
      onAddressRowPress: handleAddressRowPress,
    });

    expect(screen.getByTestId("contacts-detail-address-list")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
    expect(screen.getByTestId(`contacts-detail-address-row-${address.id}`)).toBeVisible();
    expect(screen.getByText("1 address")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-empty-state")).toBeNull();

    fireEvent.press(screen.getByTestId(`contacts-detail-address-row-${address.id}`));

    expect(handleAddressRowPress).toHaveBeenCalledWith({
      type: "open-address-detail",
      contactId: contact.id,
      addressId: address.id,
    });
  });

  it("should request adding an address when the action is pressed", () => {
    const onAddAddressHandler = jest.fn();
    renderContactDetailView({
      ...meDetailProps,
      contact: mockMeContact(),
      onAddAddress: onAddAddressHandler,
    });

    fireEvent.press(screen.getByTestId("contacts-detail-add-address"));

    expect(onAddAddressHandler).toHaveBeenCalledTimes(1);
  });

  it("should request opening Ledger Wallet addresses for Me", () => {
    const handleLedgerWalletAccountsPress = jest.fn();
    renderContactDetailView({
      ...meDetailProps,
      contact: mockMeContact(),
      onLedgerWalletAccountsPress: handleLedgerWalletAccountsPress,
    });

    fireEvent.press(screen.getByTestId("contacts-detail-ledger-wallet-addresses"));

    expect(handleLedgerWalletAccountsPress).toHaveBeenCalledWith({
      type: "open-ledger-wallet-accounts",
    });
  });
});
