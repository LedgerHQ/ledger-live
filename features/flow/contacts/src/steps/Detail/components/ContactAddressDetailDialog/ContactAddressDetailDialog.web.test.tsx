import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { createContactDetailAddressRowIntent } from "../../model/viewModel";
import { ContactAddressDetailDialog } from "./ContactAddressDetailDialog.web";
import type { ContactAddressDetailDialogProps } from "./types";

function createProps(
  overrides: Partial<ContactAddressDetailDialogProps> = {},
): ContactAddressDetailDialogProps {
  const contact = mockContact({
    id: "contact-ben",
    name: "Ben",
    addresses: [mockContactAddress({ id: "address-ethereum", currencyId: "ethereum" })],
  });
  const address = contact.addresses[0]!;
  const row = {
    addressId: address.id,
    label: address.label,
    address: address.address,
    currencyId: address.currencyId,
    intent: createContactDetailAddressRowIntent(contact.id, address.id),
  };
  const network = {
    networkId: getCryptoCurrencyById("ethereum").id,
    networkName: getCryptoCurrencyById("ethereum").name,
    networkTicker: getCryptoCurrencyById("ethereum").ticker,
    rows: [row],
  };

  return {
    isOpen: true,
    contactName: contact.name,
    row,
    network,
    labels: {
      send: "Send",
      copy: "Copy",
      copied: "Copied",
      edit: "Edit",
      delete: "Delete",
      formatNetworkTag: name => `${name} Network`,
    },
    onClose: jest.fn(),
    ...overrides,
  };
}

describe("ContactAddressDetailDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render the selected address details", () => {
    render(<ContactAddressDetailDialog {...createProps()} />);

    expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-address-detail-full-address")).toHaveTextContent(
      "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    );
    expect(screen.getByTestId("contacts-address-detail-network-tag")).toHaveAttribute(
      "label",
      "Ethereum Network",
    );
  });

  it("should copy the address and show copied feedback", async () => {
    render(<ContactAddressDetailDialog {...createProps()} />);

    fireEvent.click(screen.getByTestId("contacts-address-detail-copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copied");
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copy");
    });
  });

  it("should render nothing when row or network is missing", () => {
    const { container } = render(
      <ContactAddressDetailDialog {...createProps({ row: undefined })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
