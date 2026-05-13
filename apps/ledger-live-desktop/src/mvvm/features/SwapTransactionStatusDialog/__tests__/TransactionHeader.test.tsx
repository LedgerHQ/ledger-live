import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { render, screen } from "tests/testSetup";
import { TransactionHeader } from "../components/TransactionHeader";
import { formatCreatedAt } from "../utils";

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

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usdtEthereum: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  parentCurrency: ethereum,
  tokenType: "erc20",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  ticker: "USDT",
  name: "Tether USD",
  units: [
    {
      name: "Tether USD",
      code: "USDT",
      magnitude: 6,
    },
  ],
};
const mockedCryptoIcon = jest.mocked(CryptoIcon);

describe("TransactionHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the swap title and creation date when currencies are available", () => {
    const createdAt = new Date(2024, 0, 2, 15, 4).getTime();

    render(
      <TransactionHeader
        sendCurrency={bitcoin}
        receiveCurrency={ethereum}
        createdAt={createdAt}
        locale="en-US"
      />,
    );

    expect(screen.getByRole("heading", { name: "Swap BTC → ETH" })).toBeVisible();
    expect(screen.getByText(formatCreatedAt(createdAt, "en-US"))).toBeVisible();
  });

  it("should render token icons without a parent network badge", () => {
    render(
      <TransactionHeader
        sendCurrency={bitcoin}
        receiveCurrency={usdtEthereum}
        createdAt={new Date(2024, 0, 2, 15, 4).getTime()}
        locale="en-US"
      />,
    );

    expect(screen.getByRole("heading", { name: "Swap BTC → USDT" })).toBeVisible();
    expect(screen.getByTestId("crypto-icon-ethereum/erc20/usd_tether__erc20_")).toHaveAttribute(
      "data-network",
      "",
    );
    const receiveIconProps = mockedCryptoIcon.mock.calls.find(
      ([props]) => props.ledgerId === usdtEthereum.id,
    )?.[0];
    expect(receiveIconProps).toEqual(
      expect.objectContaining({
        ledgerId: usdtEthereum.id,
      }),
    );
    expect(receiveIconProps).not.toHaveProperty("network");
  });

  it("should hide the swap title and date while header data is loading", () => {
    render(<TransactionHeader locale="en-US" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("Swap BTC → ETH")).not.toBeInTheDocument();
  });
});
