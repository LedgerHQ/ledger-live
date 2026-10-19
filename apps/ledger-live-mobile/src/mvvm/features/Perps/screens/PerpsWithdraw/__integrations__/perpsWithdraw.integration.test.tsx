import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { beginWithdrawRequest } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";
import {
  WithdrawAddressScreeningError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { render, screen } from "@tests/test-renderer";
import PerpsWithdrawScreen from "../PerpsWithdrawScreen";

const mockOpenDrawer = jest.fn();
jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
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

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() };

function renderWithdraw(source: AccountLike = sourceAccount) {
  return render(
    <PerpsWithdrawScreen
      navigation={mockNavigation as never}
      route={{ params: { sourceAccount: source } } as never}
    />,
    {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [sourceAccount, ethAccount, btcAccount, dogeAccount],
        },
      }),
    },
  );
}

const input = () => screen.getByTestId("perps-withdraw-amount-input");
const reviewCta = () => screen.getByTestId("perps-withdraw-review-cta");
const formError = () => screen.getByTestId("perps-withdraw-form-error");

async function typeAmount(user: ReturnType<typeof renderWithdraw>["user"], digits: string) {
  for (const digit of digits) {
    await user.press(screen.getByTestId(`perps-withdraw-key-${digit}`));
  }
}

describe("PerpsWithdraw integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWithdrawCurrencies.mockReturnValue({
      currencyIds: ["ethereum", "bitcoin"],
      isError: false,
    });
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote, isLoading: false, error: null });
    mockOpenDrawer.mockImplementation(({ onAccountSelected }) => onAccountSelected(btcAccount));
  });

  it("should show the available balance in dollars", () => {
    renderWithdraw();

    expect(screen.getByText(/\$1,000\.50/)).toBeOnTheScreen();
    expect(screen.getByText("$")).toBeOnTheScreen();
  });

  it("should read the balance from the wallet's copy of the source account", () => {
    renderWithdraw({ ...sourceAccount, spendableBalance: new BigNumber(0) });

    expect(screen.getByText(/\$1,000\.50/)).toBeOnTheScreen();
  });

  it("should preselect the supported account with the highest fiat balance", () => {
    renderWithdraw();

    expect(screen.getByText("Withdraw to ETH")).toBeOnTheScreen();
    expect(screen.getByText(/\$1,000\.00/)).toBeOnTheScreen();
    expect(reviewCta()).toBeDisabled();
  });

  it("should keep the 1 USDC fee out of Max and the ratios", async () => {
    const { user } = renderWithdraw();

    await user.press(screen.getByTestId("perps-withdraw-ratio-MAX"));
    expect(input()).toHaveDisplayValue("999.5");

    await user.press(screen.getByTestId("perps-withdraw-ratio-50%"));
    expect(input()).toHaveDisplayValue("499.75");
  });

  it("should show the estimate and enable Review", async () => {
    const { user } = renderWithdraw();

    await typeAmount(user, "500");

    expect(screen.getByText(/Withdraw ~0\.3/)).toBeOnTheScreen();
    expect(screen.getByText("Swap and withdraw via SwapKit")).toBeOnTheScreen();
    expect(reviewCta()).toBeEnabled();
    expect(mockUsePerpsWithdrawQuote).toHaveBeenLastCalledWith({
      amount: "500",
      sourceAddress: sourceAccount.freshAddress,
      toCurrencyId: "ethereum",
      destinationAddress: ethAccount.freshAddress,
    });
  });

  it("should flag an amount that leaves no room for the fee, without quoting it", async () => {
    const { user } = renderWithdraw();

    await typeAmount(user, "1000");

    expect(formError()).toHaveTextContent("Insufficient balance");
    expect(reviewCta()).toBeDisabled();
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
      "low liquidity",
      new WithdrawLowLiquidityError("low"),
      "This asset is temporarily unavailable. Try again later or choose another asset.",
    ],
    [
      "a failed address screening",
      new WithdrawAddressScreeningError("screening"),
      "This withdrawal can’t be processed to this account.",
    ],
  ])("should explain %s and block Review", async (_, error, message) => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: false, error });
    const { user } = renderWithdraw();

    await typeAmount(user, "2");

    expect(formError()).toHaveTextContent(message);
    expect(reviewCta()).toBeDisabled();
  });

  it("should shimmer the estimate while quoting", async () => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: true, error: null });
    const { user } = renderWithdraw();

    await typeAmount(user, "500");

    expect(screen.getByTestId("perps-withdraw-quote-skeleton")).toBeOnTheScreen();
    expect(reviewCta()).toBeDisabled();
  });

  it("should only offer supported assets and keep the amount when the destination changes", async () => {
    const { user } = renderWithdraw();

    await typeAmount(user, "500");
    await user.press(screen.getByTestId("perps-withdraw-select-currency"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        uiUseCase: "perpetuals:withdraw",
        flow: "perpetuals:withdraw",
        currencies: ["ethereum", "bitcoin"],
        areCurrenciesFiltered: true,
      }),
    );
    expect(await screen.findByText("Withdraw to BTC")).toBeOnTheScreen();
    expect(input()).toHaveDisplayValue("500");
  });

  it("should block the form when the supported assets cannot be loaded", async () => {
    mockUseWithdrawCurrencies.mockReturnValue({ currencyIds: undefined, isError: true });
    const { user } = renderWithdraw();

    await typeAmount(user, "500");

    expect(formError()).toHaveTextContent(
      "We can’t load the assets you can withdraw to. Try again later.",
    );
    expect(reviewCta()).toBeDisabled();
  });

  it("should end the request when the screen is left", async () => {
    const outcome = beginWithdrawRequest().catch((error: unknown) => error);
    const { unmount } = renderWithdraw();

    unmount();

    expect(await outcome).toBeInstanceOf(UserRefusedOnDevice);
  });
});
