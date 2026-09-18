import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";
import { CardAssets } from "../CardAssets";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => true,
}));

jest.mock("@features/flow-pay-card-auth/hooks", () => ({
  useIsCardSignedIn: () => true,
}));

// Only the feed is stubbed: the detail dialog and the formatters stay the listing's own.
jest.mock("@features/flow-pay-card-transactions", () => ({
  ...jest.requireActual("@features/flow-pay-card-transactions"),
  useCardTransactionsViewModel: () => ({
    transactions: [
      {
        categoryLabel: "Shopping",
        transaction: {
          id: "uniqlo-usdc",
          dateTime: "2026-09-18T12:32:00.000Z",
          sign: "DEBIT",
          merchantNameLocation: "Uniqlo, Paris",
          mccCategory: "MISC",
          status: "CONFIRMED",
          transactionCurrency: "USD",
          amountInTransactionCurrency: "324.43",
          feesInTransactionCurrency: "0",
          originalCurrency: "USD",
          amountInOriginalCurrency: "324.43",
          fundingSources: [{ currency: "usdc", amount: "324.4332", sign: "DEBIT" }],
        },
      },
      {
        categoryLabel: "Health",
        transaction: {
          id: "dentist-eth",
          dateTime: "2026-09-18T11:43:00.000Z",
          sign: "DEBIT",
          merchantNameLocation: "Dentist",
          mccCategory: "HEALTH",
          status: "CONFIRMED",
          transactionCurrency: "USD",
          amountInTransactionCurrency: "434.22",
          feesInTransactionCurrency: "0",
          originalCurrency: "USD",
          amountInOriginalCurrency: "434.22",
          fundingSources: [{ currency: "eth", amount: "0.12", sign: "DEBIT" }],
        },
      },
    ],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: () => ({
    wallets: [
      {
        id: "w-usdc",
        balance: "4000",
        currency: "usdc",
        network: "ethereum",
        ledgerId: "ethereum/erc20/usd__coin",
        ledgerCurrency: USDC,
      },
    ],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

const USDC = CryptoOrTokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0x0000000000000000000000000000000000000000",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});

describe("CardAssets (web)", () => {
  function renderCardAssets() {
    render(
      <CardAssets
        currencies={new Map([[USDC.id, USDC]])}
        priceWallet={() => 4000}
        formatCountervalue={value => `$${value.toLocaleString("en-US")}.00`}
      />,
      { wrapper: I18nWrapper },
    );
  }

  it("should list the card transactions this asset funded, with the listing's own shape", async () => {
    renderCardAssets();

    fireEvent.click(screen.getByTestId("card-asset-w-usdc"));

    // Funded by USDC; the ETH one is not.
    expect(await screen.findByTestId("card-transactions-item-uniqlo-usdc")).toBeVisible();
    expect(screen.queryByTestId("card-transactions-item-dentist-eth")).not.toBeInTheDocument();
  });

  it("should open the transaction detail dialog from a row", async () => {
    renderCardAssets();

    fireEvent.click(screen.getByTestId("card-asset-w-usdc"));
    fireEvent.click(await screen.findByTestId("card-transactions-item-uniqlo-usdc"));

    expect(await screen.findByTestId("card-transaction-detail-dialog")).toBeVisible();
  });

  it("should ask the host for asset history instead of nesting it in the card", () => {
    const onShowHistory = jest.fn();
    render(
      <CardAssets
        currencies={new Map([[USDC.id, USDC]])}
        priceWallet={() => 4000}
        formatCountervalue={value => `$${value.toLocaleString("en-US")}.00`}
        onShowHistory={onShowHistory}
      />,
      { wrapper: I18nWrapper },
    );

    fireEvent.click(screen.getByTestId("card-asset-w-usdc"));
    fireEvent.click(screen.getByText(CARD_ASSETS_COPY.transactions));

    expect(onShowHistory).toHaveBeenCalledWith(expect.objectContaining({ id: "w-usdc" }));
    expect(screen.queryByTestId("card-asset-transaction-history")).not.toBeInTheDocument();
  });

  it("should reopen asset details when the withdraw dialog closes", async () => {
    renderCardAssets();

    fireEvent.click(screen.getByTestId("card-asset-w-usdc"));
    fireEvent.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.withdraw }));

    expect(screen.getByTestId("card-asset-withdraw-dialog")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.withdrawTitle)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByTestId("card-asset-withdraw-dialog")).not.toBeInTheDocument(),
    );
    expect(await screen.findByTestId("card-asset-details-dialog")).toBeVisible();
  });
});
