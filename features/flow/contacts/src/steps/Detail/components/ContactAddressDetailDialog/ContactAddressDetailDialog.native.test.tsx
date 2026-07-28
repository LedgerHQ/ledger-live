import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { createContactDetailAddressRowIntent } from "../../model/viewModel";
import { ContactAddressDetailDialog } from "./ContactAddressDetailDialog.native";
import type { ContactAddressDetailDialogNativeProps } from "./types";

jest.mock("./ContactAddressDetailQrCode.native", () => ({
  ContactAddressDetailQrCode: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, { testID: "contacts-address-detail-qr-code" }, "QR");
  },
}));

function createProps(
  overrides: Partial<ContactAddressDetailDialogNativeProps> = {},
): ContactAddressDetailDialogNativeProps {
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
      copyAddress: "Copy address",
      copied: "Copied",
      edit: "Edit",
      share: "Share",
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
    expect(screen.getByTestId("contacts-address-detail-network-tag")).toHaveProp(
      "label",
      "Ethereum Network",
    );
    expect(screen.getByTestId("contacts-address-detail-qr-code")).toBeVisible();
  });

  it("should copy the address and show copied feedback", async () => {
    const onCopyAddress = jest.fn();
    render(<ContactAddressDetailDialog {...createProps({ onCopyAddress })} />);

    fireEvent.press(screen.getByTestId("contacts-address-detail-copy"));

    expect(onCopyAddress).toHaveBeenCalledWith(
      "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    );

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copied");
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copy address");
    });
  });

  it("should render nothing when row or network is missing", () => {
    render(<ContactAddressDetailDialog {...createProps({ row: undefined })} />);

    expect(screen.queryByTestId("contacts-address-detail-dialog")).toBeNull();
  });

  it("should reset copied feedback when the dialog closes", async () => {
    const { rerender } = render(<ContactAddressDetailDialog {...createProps()} />);

    fireEvent.press(screen.getByTestId("contacts-address-detail-copy"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copied");
    });

    rerender(<ContactAddressDetailDialog {...createProps({ isOpen: false })} />);
    rerender(<ContactAddressDetailDialog {...createProps()} />);

    expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copy address");
  });
});
