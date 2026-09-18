import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { CardAssetsView } from "../CardAssetsView.web";
import { CARD_ASSETS_COPY } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

const usdc = {
  id: "w-usdc",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: "ethereum/erc20/usd__coin",
  cryptoAmount: "125.40 USDC",
  countervalue: "$125.40",
  countervalueAmount: 125.4,
};

const ready: CardAssetsViewModel = {
  isVisible: true,
  title: CARD_ASSETS_COPY.title,
  status: "ready",
  rows: [usdc],
  emptyLabel: CARD_ASSETS_COPY.empty,
  errorLabel: CARD_ASSETS_COPY.error,
  dialogState: "closed",
  selectedAsset: null,
  selectedAssetTransactions: [],
  dialogCopy: {
    topUp: "Top up",
    withdraw: "Withdraw",
    transactions: "Transactions",
    value: "Value",
    withdrawTitle: "You'll be redirected to Baanx",
    withdrawDescription: "Withdraw funds from your Baanx account to your Ledger wallet address.",
    continue: "Continue",
  },
  onAssetPress: jest.fn(),
  onDialogClose: jest.fn(),
  onTopUpPress: jest.fn(),
  onWithdrawPress: jest.fn(),
  onWithdrawClose: jest.fn(),
  onShowHistoryPress: jest.fn(),
  onWithdrawContinue: jest.fn(),
};

describe("CardAssetsView (web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should name each wallet and show what it holds and what that is worth", () => {
    render(<CardAssetsView {...ready} />);

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeInTheDocument();
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("125.40 USDC")).toBeInTheDocument();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
  });

  it("should show no counter value for a wallet nothing could price", () => {
    render(<CardAssetsView {...ready} rows={[{ ...usdc, countervalue: null }]} />);

    expect(screen.getByText("125.40 USDC")).toBeInTheDocument();
    expect(screen.queryByTestId("card-asset-countervalue-w-usdc")).not.toBeInTheDocument();
  });

  it("should give each wallet its own counter value", () => {
    render(
      <CardAssetsView
        {...ready}
        rows={[
          usdc,
          {
            id: "w-btc",
            currency: "btc",
            network: "bitcoin",
            name: "Bitcoin",
            ticker: "BTC",
            ledgerId: "bitcoin",
            cryptoAmount: "0.5 BTC",
            countervalue: "$9,900.00",
            countervalueAmount: 9900,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
    expect(screen.getByTestId("card-asset-countervalue-w-btc")).toHaveTextContent("$9,900.00");
  });

  it("should render nothing when the card is not signed in", () => {
    render(<CardAssetsView {...ready} isVisible={false} />);

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).not.toBeInTheDocument();
  });

  it("should say so when the read failed", () => {
    render(<CardAssetsView {...ready} status="error" />);

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeInTheDocument();
    expect(screen.queryByText("125.40 USDC")).not.toBeInTheDocument();
  });

  it("should say so when the card has no wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeInTheDocument();
  });

  it("should show the title alone while the wallets are still loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeInTheDocument();
    expect(screen.queryByText(CARD_ASSETS_COPY.empty)).not.toBeInTheDocument();
    expect(screen.queryByText(CARD_ASSETS_COPY.error)).not.toBeInTheDocument();
  });
});
