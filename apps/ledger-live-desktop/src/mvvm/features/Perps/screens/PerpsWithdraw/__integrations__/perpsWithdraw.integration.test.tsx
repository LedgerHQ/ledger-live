import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
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

// 1 USDC (6 decimals) is worth 2 of the counter value (2 decimals); other assets are priced 1:1
// with their balance, so 100_000 is 1,000.00.
const USDC_TO_FIAT = 2 / 10_000;
const isHyperCore = (currency: unknown) =>
  typeof currency === "object" &&
  currency !== null &&
  "id" in currency &&
  currency.id === "hypercore";
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => (currency: unknown, value: BigNumber) =>
    isHyperCore(currency) ? value.times(USDC_TO_FIAT) : value,
  useCountervaluesCache: () => ({}),
}));
jest.mock("@domain/entity-market-countervalues", () => ({
  ...jest.requireActual("@domain/entity-market-countervalues"),
  calculate: (_state: unknown, { from, value }: { from: unknown; value: number }) =>
    isHyperCore(from) ? value / USDC_TO_FIAT : value,
}));

const mockUseWithdrawCurrencies = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawCurrencies", () => ({
  useWithdrawCurrencies: () => mockUseWithdrawCurrencies(),
}));

const mockUsePerpsWithdrawQuote = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawQuote", () => ({
  usePerpsWithdrawQuote: (params: unknown) => mockUsePerpsWithdrawQuote(params),
}));

function createAccount(id: string, currencyId: string, balance: BigNumber.Value): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 }),
    spendableBalance: new BigNumber(balance),
    balance: new BigNumber(balance),
  };
}

// 1000.5 USDC in HyperCore's 6-decimal unit, worth $2,001.00.
const sourceAccount = createAccount("source-1", "hypercore", "1000500000");
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

  it("should label the amount in the counter value", () => {
    renderWithdraw();
    openWithdraw();

    expect(screen.getByText("$")).toBeVisible();
  });

  it("should follow the user's counter value currency", () => {
    render(<PerpsWithdrawRoot />, {
      initialState: {
        accounts: [sourceAccount, ethAccount],
        settings: { counterValue: "EUR" },
      },
    });
    openWithdraw();

    expect(screen.getByText("€")).toBeVisible();
    expect(screen.getByRole("dialog", { name: "Withdraw" })).toHaveAccessibleDescription(
      /2,001\.00/,
    );
  });

  it("should show the title and the available balance", () => {
    renderWithdraw();
    openWithdraw();

    expect(screen.getByRole("dialog", { name: "Withdraw" })).toHaveAccessibleDescription(
      /\$2,001\.00/,
    );
  });

  it("should read the balance from the wallet's copy of the source account", () => {
    renderWithdraw();
    openWithdraw({ sourceAccount: { ...sourceAccount, spendableBalance: new BigNumber(0) } });

    expect(screen.getByRole("dialog", { name: "Withdraw" })).toHaveAccessibleDescription(
      /\$2,001\.00/,
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

  it("should keep the 1 USDC fee out of Max and the ratios, in the counter value", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    // 999.5 USDC withdrawable, at $2 each.
    await user.click(screen.getByTestId("perps-withdraw-ratio-MAX"));
    expect(input()).toHaveDisplayValue(/^1\s?999$/);

    await user.click(screen.getByTestId("perps-withdraw-ratio-50%"));
    expect(input()).toHaveValue("999.5");
  });

  it("should show the estimated amount received and enable Review", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    await user.type(input(), "500");

    expect(screen.getByText(/Withdraw ~0\.3/)).toBeVisible();
    expect(screen.getByText("Swap and withdraw via SwapKit")).toBeVisible();
    expect(reviewCta()).toBeEnabled();
    // $500 at $2 per USDC.
    expect(mockUsePerpsWithdrawQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        amount: "250",
        sourceAccount: expect.objectContaining({ id: sourceAccount.id }),
        destinationAccount: expect.objectContaining({ id: ethAccount.id }),
        counterValueCurrency: "USD",
      }),
    );
  });

  it("should flag an amount that leaves no room for the fee", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    // $2,000 is 1,000 USDC, but only 999.5 is withdrawable after the fee.
    await user.type(input(), "2000");

    expect(formError()).toHaveTextContent("Insufficient balance");
    expect(input()).toBeInvalid();
    expect(reviewCta()).toBeDisabled();
  });

  it("should not ask for a quote when the amount leaves no room for the fee", async () => {
    const { user } = renderWithdraw();
    openWithdraw();

    // $2,000 is 1,000 USDC, but only 999.5 is withdrawable after the fee.
    await user.type(input(), "2000");

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

  it("should keep a picked token account the user never held and quote towards it", async () => {
    const emptyUsdc = { ...genTokenAccount(0, ethAccount, usdcToken), balance: new BigNumber(0) };
    mockOpenAssetAndAccount.mockResolvedValue({ account: emptyUsdc, parentAccount: ethAccount });
    const { user } = renderWithdraw();
    openWithdraw();

    await user.click(screen.getByTestId("perps-withdraw-select-currency"));

    expect(await screen.findByText("Withdraw to USDC")).toBeVisible();
    expect(mockUsePerpsWithdrawQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        destinationAccount: emptyUsdc,
        accounts: expect.arrayContaining([emptyUsdc]),
      }),
    );
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
