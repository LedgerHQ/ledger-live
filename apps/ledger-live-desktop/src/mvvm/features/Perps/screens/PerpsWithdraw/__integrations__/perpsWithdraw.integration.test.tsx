import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import {
  WithdrawAddressScreeningError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { act, render, screen } from "tests/testSetup";
import PerpsWithdrawRoot, { openPerpsWithdraw } from "../PerpsWithdrawDialog";
import type { PerpsWithdrawData } from "../usePerpsWithdrawViewModel";

const mockOpenAssetAndAccount = jest.fn();
jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({
    openAssetAndAccountPromise: (params: unknown) => mockOpenAssetAndAccount(params),
  }),
}));

// Countervalues are priced 1:1 with the balance: 100_000 (2 decimals for USD) is $1,000.00.
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
}));

const mockUseWithdrawCurrencies = jest.fn();
jest.mock("../useWithdrawCurrencies", () => ({
  useWithdrawCurrencies: () => mockUseWithdrawCurrencies(),
}));

const mockUsePerpsWithdrawQuote = jest.fn();
jest.mock("../usePerpsWithdrawQuote", () => ({
  usePerpsWithdrawQuote: (params: unknown) => mockUsePerpsWithdrawQuote(params),
}));

function createAccount(id: string, currencyId: string, balance: BigNumber.Value): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 }),
    spendableBalance: new BigNumber(balance),
    balance: new BigNumber(balance),
  };
}

// 1000.5 in the source currency's units; the screen reads it as USDC.
const sourceAccount = createAccount("source-1", "ethereum", "1000500000000000000000");
const ethAccount = createAccount("eth-1", "ethereum", 100_000);
const btcAccount = createAccount("btc-1", "bitcoin", 50_000);
const dogeAccount = createAccount("doge-1", "dogecoin", 900_000);

const quote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: 1792000000000,
};

const withdrawData: PerpsWithdrawData = { sourceAccount };

function renderWithdraw() {
  return render(<PerpsWithdrawRoot />, {
    initialState: { accounts: [sourceAccount, ethAccount, btcAccount, dogeAccount] },
  });
}

function openWithdraw(data: PerpsWithdrawData = withdrawData) {
  act(() => openPerpsWithdraw(data));
}

const input = () => screen.getByTestId("perps-withdraw-amount-input");
const reviewCta = () => screen.getByTestId("perps-withdraw-review-cta");
const formError = () => screen.getByTestId("perps-withdraw-form-error");

describe("PerpsWithdraw integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWithdrawCurrencies.mockReturnValue({
      currencyIds: ["ethereum", "bitcoin"],
      isError: false,
    });
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote, isLoading: false, error: null });
    mockOpenAssetAndAccount.mockResolvedValue({ account: btcAccount });
  });

  it("should not render until a withdrawal is opened", () => {
    renderWithdraw();

    expect(screen.queryByTestId("perps-withdraw-amount-input")).not.toBeInTheDocument();
  });

  it("should show the title and the available balance", () => {
    renderWithdraw();
    openWithdraw();

    expect(screen.getByRole("dialog", { name: "Withdraw" })).toHaveAccessibleDescription(
      /\$1,000\.50/,
    );
  });

  it("should read the balance from the wallet's copy of the source account", () => {
    renderWithdraw();
    openWithdraw({ sourceAccount: { ...sourceAccount, spendableBalance: new BigNumber(0) } });

    expect(screen.getByRole("dialog", { name: "Withdraw" })).toHaveAccessibleDescription(
      /\$1,000\.50/,
    );
  });

  it("should preselect the supported account with the highest fiat balance", () => {
    renderWithdraw();
    openWithdraw();

    const selector = screen.getByTestId("perps-withdraw-select-currency");
    expect(selector).toHaveTextContent("Withdraw to ETH");
    expect(selector).toHaveTextContent("$1,000.00");
    expect(reviewCta()).toBeDisabled();
  });

  it("should keep the 1 USDC fee out of Max and the ratios", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.click(screen.getByTestId("perps-withdraw-ratio-MAX"));
    expect(input()).toHaveValue("999.5");

    await user.click(screen.getByTestId("perps-withdraw-ratio-50%"));
    expect(input()).toHaveValue("499.75");
  });

  it("should show the estimated amount received and enable Review", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "500");

    expect(screen.getByText(/Withdraw ~0\.3/)).toBeVisible();
    expect(screen.getByText("Swap and withdraw via SwapKit")).toBeVisible();
    expect(reviewCta()).toBeEnabled();
    expect(mockUsePerpsWithdrawQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        amount: "500",
        sourceAccount: expect.objectContaining({ id: sourceAccount.id }),
        destinationAccount: expect.objectContaining({ id: ethAccount.id }),
        counterValueCurrency: "USD",
      }),
    );
  });

  it("should flag an amount that leaves no room for the fee", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "1000");

    expect(formError()).toHaveTextContent("Insufficient balance");
    expect(input()).toBeInvalid();
    expect(reviewCta()).toBeDisabled();
  });

  it("should not ask for a quote when the amount leaves no room for the fee", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "1000");

    expect(mockUsePerpsWithdrawQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: "" }),
    );
  });

  it.each([
    [
      "the minimum amount",
      new WithdrawMinimumAmountError("min", { minAmount: new BigNumber(5) }),
      "The minimum withdrawal is 5 USDC.",
    ],
    [
      "an unknown minimum amount",
      new WithdrawMinimumAmountError("min"),
      "This amount is too low to withdraw.",
    ],
    [
      "low liquidity",
      new WithdrawLowLiquidityError("low"),
      "This asset is temporarily unavailable. Try again later or choose another asset.",
    ],
    [
      "a failed address screening",
      new WithdrawAddressScreeningError("screening"),
      "This withdrawal can’t be processed to this account.",
    ],
    [
      "any other quote error",
      new Error("down"),
      "We can’t get a quote from SwapKit, try with a different asset or come back later.",
    ],
  ])("should explain %s and block Review", async (_, error, message) => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: false, error });
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "2");

    expect(formError()).toHaveTextContent(message);
    expect(reviewCta()).toBeDisabled();
  });

  it("should shimmer the estimate and keep Review disabled while quoting", async () => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: true, error: null });
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "500");

    expect(screen.getByTestId("perps-withdraw-quote-skeleton")).toBeVisible();
    expect(reviewCta()).toBeDisabled();
  });

  it("should only offer supported assets and keep the amount when the destination changes", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "500");
    await user.click(screen.getByTestId("perps-withdraw-select-currency"));

    // Like swap, the backend filters to swappable assets: listing every id would overflow the URL.
    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith({
      useCase: "swap",
      uiUseCase: "perpetuals:withdraw",
      areCurrenciesFiltered: false,
    });
    expect(await screen.findByText("Withdraw to BTC")).toBeVisible();
    expect(input()).toHaveValue("500");
  });

  it("should block the form when the supported assets cannot be loaded", async () => {
    mockUseWithdrawCurrencies.mockReturnValue({ currencyIds: undefined, isError: true });
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "500");

    expect(formError()).toHaveTextContent(
      "We can’t load the assets you can withdraw to. Try again later.",
    );
    expect(reviewCta()).toBeDisabled();
  });

  it("should restore the draft when reopened from the summary", () => {
    renderWithdraw();
    openWithdraw({
      ...withdrawData,
      draft: { destinationAccountId: btcAccount.id, amountText: "250" },
    });

    expect(input()).toHaveValue("250");
    expect(screen.getByText("Withdraw to BTC")).toBeVisible();
  });
});
