import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  mockContact,
  mockContactAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import type { ContactDetailLabels } from "./types";
import { ContactDetailView } from "./ContactDetailView.web";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  addExternalAddress: "Add external address",
  emptyMeTitle: "No saved addresses for you",
  emptyContactTitle: name => `No saved addresses for ${name}`,
  emptyMeDescription: "Save your wallet addresses to receive crypto by name next time.",
  emptyContactDescription: () => "Save their wallet addresses to send to them by name next time.",
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
    render(
      <ContactDetailView
        {...defaultProps}
        contact={mockMeContact({ name: "Maxime" })}
      />,
    );

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
      screen.getByText("Save their wallet addresses to send to them by name next time."),
    ).toBeInTheDocument();
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
  });
});
