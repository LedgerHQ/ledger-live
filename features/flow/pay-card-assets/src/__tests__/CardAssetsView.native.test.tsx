import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardAssetsView } from "../CardAssetsView.native";
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

describe("CardAssetsView (native)", () => {
  it("should name each wallet and show what it holds and what that is worth", () => {
    render(<CardAssetsView {...ready} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeTruthy();
    expect(screen.getByText("USD Coin")).toBeTruthy();
    expect(screen.getByText("USDC")).toBeTruthy();
    expect(screen.getByText("125.40 USDC")).toBeTruthy();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
  });

  it("should reserve the countervalue line while a wallet cannot be priced", () => {
    render(<CardAssetsView {...ready} rows={[{ ...usdc, countervalue: null }]} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("125.40 USDC")).toBeTruthy();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toBeTruthy();
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

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).toBeNull();
  });

  it("should say so when the read failed", () => {
    render(<CardAssetsView {...ready} status="error" />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeTruthy();
    expect(screen.queryByText("125.40 USDC")).toBeNull();
  });

  it("should say so when the card has no wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeTruthy();
  });

  it("should show a skeleton list while the wallets are still loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeTruthy();
    expect(screen.getByTestId("card-assets-loading-state")).toBeTruthy();
    expect(screen.queryByText(CARD_ASSETS_COPY.empty)).toBeNull();
    expect(screen.queryByText(CARD_ASSETS_COPY.error)).toBeNull();
  });
});
