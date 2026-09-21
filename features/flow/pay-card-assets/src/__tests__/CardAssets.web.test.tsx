import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";
import { CardAssets } from "../CardAssets";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";

const mockUnwrapUpdate = jest.fn();
const mockUpdateCardWalletPriorities = jest.fn(() => ({ unwrap: mockUnwrapUpdate }));

jest.mock("@domain/api-card-management", () => ({
  useUpdateCardWalletPrioritiesMutation: () => [
    mockUpdateCardWalletPriorities,
    { isLoading: false },
  ],
}));

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

jest.mock("@features/flow-pay-card-wallets", () => {
  const { CryptoOrTokenCurrencySchema } = jest.requireActual("@domain/entity-currency");
  const ledgerCurrency = CryptoOrTokenCurrencySchema.parse({
    type: "TokenCurrency",
    id: "ethereum/erc20/usd__coin",
    parentCurrencyId: "ethereum",
    contractAddress: "0x0000000000000000000000000000000000000000",
    tokenType: "erc20",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  });

  return {
    useCardLinkedWallets: () => ({
      wallets: [
        {
          id: "w-usdc",
          addressId: "address-usdc",
          balance: "4000",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency,
        },
        {
          id: "w-usdt",
          addressId: "address-usdt",
          balance: "20",
          currency: "usdt",
          network: "ethereum",
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    }),
  };
});

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

const formatBalance = (value: number) => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: "." as const,
  currencyPosition: "start" as const,
});

describe("CardAssets (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnwrapUpdate.mockResolvedValue({ success: true });
  });

  function renderCardAssets(onAddAsset?: () => void) {
    render(
      <CardAssets
        currencies={new Map([[USDC.id, USDC]])}
        priceWallet={() => 4000}
        formatCountervalue={value => `$${value.toLocaleString("en-US")}.00`}
        formatBalance={formatBalance}
        onAddAsset={onAddAsset}
      />,
      { wrapper: I18nWrapper },
    );
  }

  it("should show what the asset is worth on top of its details", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByTestId("card-asset-w-usdc"));

    expect(await screen.findByTestId("card-asset-details-amount")).toBeVisible();
  });

  it("should keep AmountDisplay loading when the host has no balance formatter", async () => {
    const user = userEvent.setup();
    render(
      <CardAssets
        currencies={new Map([[USDC.id, USDC]])}
        priceWallet={() => 4000}
        formatCountervalue={value => `$${value.toLocaleString("en-US")}.00`}
      />,
      { wrapper: I18nWrapper },
    );

    await user.click(screen.getByTestId("card-asset-w-usdc"));

    expect(await screen.findByTestId("card-asset-details-dialog")).toBeVisible();
    expect(screen.getByTestId("card-asset-details-amount")).toBeVisible();
    expect(screen.getByTestId("card-asset-details-amount-display")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("should show summary-style rows when an asset is selected", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByTestId("card-asset-w-usdc"));

    expect(await screen.findByTestId("card-transactions-item-uniqlo-usdc")).toBeVisible();
    expect(screen.queryByTestId("card-asset-details-transactions-empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-transactions-item-dentist-eth")).not.toBeInTheDocument();
    expect(screen.getByText("-324.43 USD")).toBeVisible();
    expect(screen.getByText("-324.4332 USDC")).toBeVisible();
  });

  it("should open transaction details when a summary row is pressed", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByTestId("card-asset-w-usdc"));
    await user.click(await screen.findByTestId("card-transactions-item-uniqlo-usdc"));

    expect(await screen.findByTestId("card-transaction-detail-dialog")).toBeVisible();
  });

  it("should ask the host for asset history when Transactions is pressed", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByTestId("card-asset-w-usdc"));
    await user.click(screen.getByText(CARD_ASSETS_COPY.transactions));

    expect(onShowHistory).toHaveBeenCalledWith(expect.objectContaining({ id: "w-usdc" }));
    expect(screen.queryByTestId("card-asset-transaction-history")).not.toBeInTheDocument();
  });

  it("should return to asset details when the withdraw dialog closes", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByTestId("card-asset-w-usdc"));
    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.withdraw }));

    expect(screen.getByTestId("card-asset-withdraw-dialog")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.withdrawTitle)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByTestId("card-asset-withdraw-dialog")).not.toBeInTheDocument(),
    );
    expect(await screen.findByTestId("card-asset-details-dialog")).toBeVisible();
  });

  it("should open the manage dialog with linked assets", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.manage }));

    const dialog = screen.getByTestId("card-assets-manage-dialog");
    expect(
      within(dialog).getByRole("heading", { name: CARD_ASSETS_COPY.manageDialogTitle }),
    ).toBeVisible();
    expect(within(dialog).getByText(CARD_ASSETS_COPY.manageDialogDescription)).toBeVisible();
    expect(within(dialog).getByText("USD Coin")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: CARD_ASSETS_COPY.addAsset })).toBeVisible();
  });

  it("should reorder assets with the drag handle and send every linked wallet", async () => {
    let finishUpdate: (result: { success: boolean }) => void = () => {};
    mockUnwrapUpdate.mockReturnValue(
      new Promise(resolve => {
        finishUpdate = resolve;
      }),
    );
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.manage }));
    fireEvent.dragStart(screen.getByRole("button", { name: "Drag USDT" }));
    fireEvent.drop(screen.getByTestId("card-asset-order-w-usdc"));

    expect(screen.getByTestId("card-asset-reorder-spinner-w-usdt")).toBeVisible();
    await waitFor(() =>
      expect(mockUpdateCardWalletPriorities).toHaveBeenCalledWith({
        wallets: [
          { addressId: "address-usdt", priority: 1 },
          { addressId: "address-usdc", priority: 2 },
        ],
      }),
    );
    await act(() => {
      finishUpdate({ success: true });
    });
    await waitFor(() =>
      expect(screen.queryByTestId("card-asset-reorder-spinner-w-usdt")).not.toBeInTheDocument(),
    );
  });

  it("should return to the asset list when the manage dialog closes", async () => {
    const user = userEvent.setup();
    renderCardAssets();

    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.manage }));
    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByTestId("card-assets-manage-dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("card-assets")).toBeVisible();
  });

  it("should ask the host to add an asset", async () => {
    const user = userEvent.setup();
    const onAddAsset = jest.fn();
    renderCardAssets(onAddAsset);

    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.manage }));
    await user.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.addAsset }));

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });
});
