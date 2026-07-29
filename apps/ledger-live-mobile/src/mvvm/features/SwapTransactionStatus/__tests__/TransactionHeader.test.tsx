import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { formatSwapTransactionStatusCreatedAt } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { render, screen } from "@tests/test-renderer";
import { TransactionHeader } from "../components/TransactionHeader";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usdtEthereum = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  parentCurrencyId: ethereum.id,
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
} as unknown as TokenCurrency;

describe("TransactionHeader", () => {
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

    expect(screen.getByText("Swap BTC → ETH")).toBeVisible();
    expect(
      screen.getByText(formatSwapTransactionStatusCreatedAt(createdAt, "en-US")),
    ).toBeVisible();
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

    expect(screen.getByText("Swap BTC → USDT")).toBeVisible();
  });

  it("should hide the swap title and date while header data is loading", () => {
    render(<TransactionHeader locale="en-US" />);

    expect(screen.queryByText("Swap BTC → ETH")).toBeNull();
  });
});
