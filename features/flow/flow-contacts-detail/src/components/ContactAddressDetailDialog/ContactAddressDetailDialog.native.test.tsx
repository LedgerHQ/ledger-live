import React from "react";
import {
  fireEvent,
  render as renderWithoutI18n,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { I18nTestProvider } from "@shared/i18n/testing";
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

const render = (ui: React.ReactElement) => renderWithoutI18n(ui, { wrapper: I18nTestProvider });

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
    onClose: jest.fn(),
    onCopyAddress: jest.fn().mockResolvedValue(true),
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
      "contacts.addressDetail.networkTag",
    );
    expect(screen.getByTestId("contacts-address-detail-share")).toHaveTextContent(
      "contacts.addressDetail.share",
    );
    expect(screen.getByTestId("contacts-address-detail-qr-code")).toBeVisible();
  });

  it("should copy the address and show copied feedback", async () => {
    const onCopyAddress = jest.fn().mockResolvedValue(true);
    render(<ContactAddressDetailDialog {...createProps({ onCopyAddress })} />);

    fireEvent.press(screen.getByTestId("contacts-address-detail-copy"));

    expect(onCopyAddress).toHaveBeenCalledWith("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent(
        "contacts.addressDetail.copied",
      );
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent(
        "contacts.addressDetail.copyAddress",
      );
    });
  });

  it("should share the selected address when sharing is available", () => {
    const onShareAddress = jest.fn();
    render(<ContactAddressDetailDialog {...createProps({ onShareAddress })} />);

    fireEvent.press(screen.getByTestId("contacts-address-detail-share"));

    expect(onShareAddress).toHaveBeenCalledWith("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
  });

  it("should render nothing when row or network is missing", () => {
    render(<ContactAddressDetailDialog {...createProps({ row: undefined })} />);

    expect(screen.queryByTestId("contacts-address-detail-dialog")).toBeNull();
  });

  it("should reset copied feedback when the dialog closes", async () => {
    const { rerender } = render(<ContactAddressDetailDialog {...createProps()} />);

    fireEvent.press(screen.getByTestId("contacts-address-detail-copy"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent(
        "contacts.addressDetail.copied",
      );
    });

    rerender(<ContactAddressDetailDialog {...createProps({ isOpen: false })} />);
    rerender(<ContactAddressDetailDialog {...createProps()} />);

    expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent(
      "contacts.addressDetail.copyAddress",
    );
  });
});
