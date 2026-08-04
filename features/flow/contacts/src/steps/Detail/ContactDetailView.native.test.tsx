import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactDetailLabels } from "./types";
import { ContactDetailView } from "./ContactDetailView.native";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  addYourAddress: "Add your address",
  emptyMeTitle: "Save your own addresses",
  emptyContactTitle: () => "No address yet",
  emptyMeDescription: "Save external addresses for Me.",
  emptyContactDescription: name => `Save wallet address to send to ${name}`,
  ledgerWalletAddresses: "Ledger Wallet addresses",
  myAddresses: "My addresses",
  formatAddressCount: count => `${count} address`,
};

const onAddAddress = () => undefined;
const onOpenLedgerWalletAddresses = () => undefined;

const defaultProps = {
  labels,
  meAvatarSrc: "https://example.com/avatar.png",
  onAddAddress,
  onOpenLedgerWalletAddresses,
};

describe("ContactDetailPage", () => {
  it("should render the Me empty state", () => {
    render(<ContactDetailView {...defaultProps} contact={mockMeContact()} />);

    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByText("My addresses")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add your address");
    expect(screen.getByTestId("contacts-detail-ledger-wallet-addresses")).toHaveTextContent(
      "Ledger Wallet addresses",
    );
    expect(screen.getByText("Save your own addresses")).toBeVisible();
    expect(screen.getByText("Save external addresses for Me.")).toBeVisible();
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
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add address");
    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
    expect(screen.getByText("No address yet")).toBeVisible();
    expect(screen.getByText("Save wallet address to send to Benoit")).toBeVisible();
  });

  it("should keep the shared detail defaults without Mobile-specific props", () => {
    const sharedLabels: ContactDetailLabels = {
      addAddress: labels.addAddress,
      emptyMeTitle: labels.emptyMeTitle,
      emptyContactTitle: labels.emptyContactTitle,
      emptyMeDescription: labels.emptyMeDescription,
      emptyContactDescription: labels.emptyContactDescription,
      formatAddressCount: labels.formatAddressCount,
    };

    render(
      <ContactDetailView
        contact={mockMeContact()}
        labels={sharedLabels}
        meAvatarSrc={defaultProps.meAvatarSrc}
        onAddAddress={onAddAddress}
      />,
    );

    expect(screen.getByText("Me")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add address");
    expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
  });

  it("should request adding an address when the action is pressed", () => {
    const onAddAddress = jest.fn();
    render(
      <ContactDetailView {...defaultProps} contact={mockMeContact()} onAddAddress={onAddAddress} />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-add-address"));

    expect(onAddAddress).toHaveBeenCalledTimes(1);
  });

  it("should request opening Ledger Wallet addresses for Me", () => {
    const onOpenLedgerWalletAddresses = jest.fn();
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockMeContact()}
        onOpenLedgerWalletAddresses={onOpenLedgerWalletAddresses}
      />,
    );

    fireEvent.press(screen.getByTestId("contacts-detail-ledger-wallet-addresses"));

    expect(onOpenLedgerWalletAddresses).toHaveBeenCalledTimes(1);
  });
});
