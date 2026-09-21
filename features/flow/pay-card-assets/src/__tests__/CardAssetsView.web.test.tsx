import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { CardAssetsView } from "../CardAssetsView.web";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
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
  status: "ready",
  rows: [usdc],
  dialogState: "closed",
  selectedAsset: null,
  selectedAssetTransactions: [],
  dialogCopy: {
    topUp: "Top up",
    withdraw: "Withdraw",
    transactions: "Transactions",
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

const formatBalance = (value: number) => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: "." as const,
  currencyPosition: "start" as const,
});

const detailsOpen: CardAssetsViewModel = {
  ...ready,
  dialogState: "details",
  selectedAsset: usdc,
  formatBalance,
};

describe("CardAssetsView (web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should name each wallet and show what it holds and what that is worth", () => {
    render(<CardAssetsView {...ready} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeInTheDocument();
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("125.40 USDC")).toBeInTheDocument();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
  });

  it("should reserve the countervalue line while a wallet cannot be priced", () => {
    render(<CardAssetsView {...ready} rows={[{ ...usdc, countervalue: null }]} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("125.40 USDC")).toBeInTheDocument();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toBeInTheDocument();
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
      { wrapper: I18nWrapper },
    );

    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
    expect(screen.getByTestId("card-asset-countervalue-w-btc")).toHaveTextContent("$9,900.00");
  });

  it("should render nothing when the card is not signed in", () => {
    render(<CardAssetsView {...ready} isVisible={false} />, { wrapper: I18nWrapper });

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).not.toBeInTheDocument();
  });

  it("should say so when the read failed", () => {
    render(<CardAssetsView {...ready} status="error" />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeInTheDocument();
    expect(screen.queryByText("125.40 USDC")).not.toBeInTheDocument();
  });

  it("should say so when the card has no wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeInTheDocument();
  });

  it("should show a skeleton list while the wallets are still loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeInTheDocument();
    expect(screen.getByTestId("card-assets-loading-state")).toBeInTheDocument();
    expect(screen.queryByText(CARD_ASSETS_COPY.empty)).not.toBeInTheDocument();
    expect(screen.queryByText(CARD_ASSETS_COPY.error)).not.toBeInTheDocument();
  });

  it("should keep AmountDisplay loading while the counter value is still missing", () => {
    render(
      <CardAssetsView
        {...detailsOpen}
        selectedAsset={{ ...usdc, countervalue: null, countervalueAmount: null }}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByTestId("card-asset-details-amount")).toBeVisible();
    expect(screen.getByTestId("card-asset-details-amount-display")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("should drop AmountDisplay loading once the counter value lands", () => {
    render(<CardAssetsView {...detailsOpen} />, { wrapper: I18nWrapper });

    expect(screen.getByTestId("card-asset-details-amount")).toBeVisible();
    expect(screen.getByTestId("card-asset-details-amount-display")).not.toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("should drop the transactions header for Card's empty state when the asset has none", () => {
    render(<CardAssetsView {...detailsOpen} />, { wrapper: I18nWrapper });

    expect(screen.queryByText(CARD_ASSETS_COPY.transactions)).not.toBeInTheDocument();
    expect(screen.getByTestId("card-asset-details-transactions-empty")).toHaveTextContent(
      CARD_ASSETS_COPY.transactionsEmpty,
    );
  });

  it("should keep the section title as a heading, not a hoverable row", () => {
    render(<CardAssetsView {...ready} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.queryByRole("button", { name: CARD_ASSETS_COPY.title })).not.toBeInTheDocument();
  });

  it("should explain the assets list in a tooltip next to the title", () => {
    render(<CardAssetsView {...ready} />, { wrapper: I18nWrapper });

    expect(screen.getByLabelText(CARD_ASSETS_COPY.info)).toBeVisible();
    expect(screen.getByRole("tooltip")).toHaveTextContent(CARD_ASSETS_COPY.info);
  });
});
