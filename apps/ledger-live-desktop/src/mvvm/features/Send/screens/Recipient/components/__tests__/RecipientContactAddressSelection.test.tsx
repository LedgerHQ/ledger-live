import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import React from "react";
import { render, screen } from "tests/testSetup";
import { RecipientContactAddressSelection } from "../RecipientContactAddressSelection";

describe("RecipientContactAddressSelection", () => {
  it("renders compatible addresses and selects the requested address", async () => {
    const network = getCryptoCurrencyById("ethereum");
    const contact = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [
        mockContactAddress({
          id: "address-main",
          label: "Ethereum",
          address: "0xd03f8fd01234567890abcdef123456783f0f2d19",
        }),
        mockContactAddress({
          id: "address-coinbase",
          label: "Ethereum Coinbase",
          address: "0xabcdef01234567890abcdef1234567890abcdef0",
        }),
      ],
    });
    const onAddressSelect = jest.fn();
    const { user } = render(
      <RecipientContactAddressSelection
        contact={contact}
        network={network}
        onAddressSelect={onAddressSelect}
      />,
    );

    expect(screen.getAllByText("Ethereum")).toHaveLength(2);
    expect(screen.getByText("Ethereum Coinbase")).toBeVisible();
    expect(screen.getByText("0xd03f8f...3f0f2d19")).toBeVisible();
    expect(screen.getByTestId("send-recipient-contact-address-address-main")).toHaveFocus();

    await user.click(screen.getByTestId("send-recipient-contact-address-address-coinbase"));
    expect(onAddressSelect).toHaveBeenCalledWith("0xabcdef01234567890abcdef1234567890abcdef0");
  });
});
