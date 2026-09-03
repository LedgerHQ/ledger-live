import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";
import { ContactAddressPicker } from "../ContactAddressPicker.web";
import type { ContactAddressPickerProps } from "../../../types";

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

function renderPicker(overrides: Partial<ContactAddressPickerProps> = {}) {
  return renderWithStyle(<ContactAddressPicker {...defaultProps} {...overrides} />);
}

describe("ContactAddressPicker (Web)", () => {
  it("renders the title and address groups", () => {
    renderPicker();

    expect(screen.getByText("Select Ada's address")).toBeVisible();
    expect(screen.getByTestId("pay-contact-address-group-ethereum")).toBeVisible();
    expect(screen.getByTestId("pay-contact-address-row-address-eth")).toBeVisible();
    expect(screen.getByText("0x1ad23b...46c53034")).toBeVisible();
  });

  it("selecting a row calls onSelectAddress", () => {
    const onSelectAddress = jest.fn();
    renderPicker({ onSelectAddress });

    fireEvent.click(screen.getByTestId("pay-contact-address-row-address-eth"));

    expect(onSelectAddress).toHaveBeenCalledWith(contactAddress);
  });

  it("shows the add-address action when onAddNewAddress is provided", () => {
    const onAddNewAddress = jest.fn();
    const { rerender } = renderPicker();

    expect(screen.queryByTestId("pay-contact-address-add")).not.toBeInTheDocument();

    rerender(<ContactAddressPicker {...defaultProps} onAddNewAddress={onAddNewAddress} />);
    fireEvent.click(screen.getByTestId("pay-contact-address-add"));

    expect(onAddNewAddress).toHaveBeenCalledTimes(1);
  });

  it.each<[string, Partial<ContactAddressPickerProps>]>([
    ["closed", { isOpen: false }],
    ["without a contact", { contact: null }],
  ])("renders nothing when %s", (_label, overrides) => {
    renderPicker(overrides);

    expect(screen.queryByTestId("pay-contact-address-picker")).not.toBeInTheDocument();
  });

  it("closing calls onClose", () => {
    const onClose = jest.fn();
    renderPicker({ onClose });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
