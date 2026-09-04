import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import React from "react";
import { render, screen } from "tests/testSetup";
import { RecipientContactAddressSelection } from "../RecipientContactAddressSelection";

jest.mock("@ledgerhq/crypto-icons", () => {
  const React = jest.requireActual("react");

  return {
    CryptoIcon: jest.fn(({ ledgerId, network, ticker }) =>
      React.createElement(
        "span",
        { "data-network": network ?? "", "data-testid": `crypto-icon-${ledgerId}` },
        ticker,
      ),
    ),
  };
});

const mockedCryptoIcon = jest.mocked(CryptoIcon);

describe("RecipientContactAddressSelection", () => {
  beforeEach(() => {
    mockedCryptoIcon.mockClear();
  });

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

  it("should derive each address icon from the address currency and omit a redundant network badge", () => {
    const network = getCryptoCurrencyById("ethereum");
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-eth",
          currencyId: "ethereum",
          label: "Ethereum",
        }),
        mockContactAddress({
          id: "address-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          label: "USDC",
        }),
      ],
    });

    render(
      <RecipientContactAddressSelection
        contact={contact}
        network={network}
        onAddressSelect={jest.fn()}
      />,
    );

    const nativeIconCall = mockedCryptoIcon.mock.calls.find(
      ([props]) => props.ledgerId === "ethereum" && props.size === 40,
    );
    const tokenIconCall = mockedCryptoIcon.mock.calls.find(
      ([props]) => props.ledgerId === "ethereum/erc20/usd_coin",
    );

    expect(nativeIconCall?.[0]).toEqual(
      expect.objectContaining({
        ledgerId: "ethereum",
        ticker: network.ticker,
        network: undefined,
      }),
    );
    expect(tokenIconCall?.[0]).toEqual(
      expect.objectContaining({
        ledgerId: "ethereum/erc20/usd_coin",
        ticker: "USDC",
        network: network.id,
      }),
    );
  });
});
