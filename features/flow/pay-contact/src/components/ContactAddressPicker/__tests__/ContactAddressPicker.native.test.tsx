import React from "react";
import { View } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { ContactAddressPicker } from "../ContactAddressPicker.native";
import type { ContactAddressPickerProps } from "../../../types";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
  }) => (
    <View accessibilityState={{ expanded: !!isRequestingToBeOpened }} testID="queued-sheet">
      {children}
    </View>
  ),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

const contactAddress = mockContactAddress({
  id: "address-eth",
  currencyId: "ethereum",
  label: "Ethereum",
});

const defaultProps: ContactAddressPickerProps = {
  isOpen: true,
  contact: mockContact({ id: "contact-ada", name: "Ada", addresses: [contactAddress] }),
  title: "Select Ada's address",
  addAddressLabel: "Add address",
  groups: [
    {
      networkId: "ethereum",
      networkName: "Ethereum",
      networkTicker: "ETH",
      rows: [
        {
          addressId: contactAddress.id,
          label: contactAddress.label,
          address: "0x1ad23b...46c53034",
          icon: { ledgerId: "ethereum", ticker: "ETH" },
          contactAddress,
        },
      ],
    },
  ],
  onClose: jest.fn(),
  onSelectAddress: jest.fn(),
};

describe("ContactAddressPicker (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and address groups", () => {
    render(<ContactAddressPicker {...defaultProps} />);

    expect(screen.getByTestId("pay-contact-address-picker")).toBeVisible();
    expect(screen.getByTestId("pay-contact-address-group-ethereum")).toBeVisible();
    expect(screen.getByTestId("pay-contact-address-row-address-eth")).toBeVisible();
    expect(screen.getByText("0x1ad23b...46c53034")).toBeVisible();
  });

  it("selecting a row calls onSelectAddress", () => {
    const onSelectAddress = jest.fn();
    render(<ContactAddressPicker {...defaultProps} onSelectAddress={onSelectAddress} />);

    fireEvent.press(screen.getByTestId("pay-contact-address-row-address-eth"));

    expect(onSelectAddress).toHaveBeenCalledWith(contactAddress);
  });

  it("shows the add-address action when onAddNewAddress is provided", () => {
    const onAddNewAddress = jest.fn();
    render(<ContactAddressPicker {...defaultProps} onAddNewAddress={onAddNewAddress} />);

    fireEvent.press(screen.getByTestId("pay-contact-address-add"));

    expect(onAddNewAddress).toHaveBeenCalledTimes(1);
  });

  it("keeps the sheet mounted but hides content when closed", () => {
    render(<ContactAddressPicker {...defaultProps} isOpen={false} />);

    expect(screen.getByTestId("queued-sheet").props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-contact-address-picker")).toBeNull();
  });
});
