import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
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
  expiry: Date.now() + 60_000,
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

  it("should show the available balance and label the amount in the counter value", () => {
    renderWithdraw();

    expect(screen.getByText(/\$2,001\.00/)).toBeOnTheScreen();
    expect(screen.getByText("$")).toBeOnTheScreen();
  });

  it("should follow the user's counter value currency", () => {
    render(
      <PerpsWithdrawScreen
        navigation={mockNavigation as never}
        route={{ params: { sourceAccount } } as never}
      />,
      {
        overrideInitialState: state => ({
          ...state,
          settings: { ...state.settings, counterValue: "EUR" },
          accounts: { ...state.accounts, active: [sourceAccount, ethAccount] },
        }),
      },
    );

    expect(screen.getByText("€")).toBeOnTheScreen();
    expect(screen.getByText(/2,001\.00/)).toBeOnTheScreen();
  });

  it("should read the balance from the wallet's copy of the source account", () => {
    renderWithdraw({ ...sourceAccount, spendableBalance: new BigNumber(0) });

    expect(screen.getByText(/\$2,001\.00/)).toBeOnTheScreen();
  });

  it("should preselect the supported account with the highest fiat balance", () => {
    renderWithdraw();

    expect(screen.getByText("Withdraw to ETH")).toBeOnTheScreen();
    expect(screen.getByText(/\$1,000\.00/)).toBeOnTheScreen();
    expect(reviewCta()).toBeDisabled();
  });

  it("should keep the 1 USDC fee out of Max and the ratios, in the counter value", async () => {
    const { user } = renderWithdraw();

    // 999.5 USDC withdrawable, at $2 each.
    await user.press(screen.getByTestId("perps-withdraw-ratio-MAX"));
    expect(input()).toHaveDisplayValue(/^1\s?999$/);

    await user.press(screen.getByTestId("perps-withdraw-ratio-50%"));
    expect(input()).toHaveDisplayValue("999.5");
  });

  it("should show the estimate and enable Review", async () => {
    const { user } = renderWithdraw();

    await typeAmount(user, "500");

    expect(screen.getByText(/Withdraw ~0\.3/)).toBeOnTheScreen();
    expect(screen.getByText("Swap and withdraw via SwapKit")).toBeOnTheScreen();
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

  it("should flag an amount that leaves no room for the fee, without quoting it", async () => {
    const { user } = renderWithdraw();

    // $2,000 is 1,000 USDC, but only 999.5 is withdrawable after the fee.
    await typeAmount(user, "2000");

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

  it("should let swap filter the destinations and keep the amount when they change", async () => {
    const { user } = renderWithdraw();

    await typeAmount(user, "500");
    await user.press(screen.getByTestId("perps-withdraw-select-currency"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        useCase: "swap",
        uiUseCase: "perpetuals:withdraw",
        flow: "perpetuals:withdraw",
        areCurrenciesFiltered: false,
      }),
    );
    // A currency list would go in the assets URL and overflow it.
    expect(mockOpenDrawer.mock.calls[0]?.[0]).not.toHaveProperty("currencies");
    expect(await screen.findByText("Withdraw to BTC")).toBeOnTheScreen();
    expect(input()).toHaveDisplayValue("500");
  });

  it("should keep a picked token account the user never held and quote towards it", async () => {
    const emptyUsdc = { ...genTokenAccount(0, ethAccount, usdcToken), balance: new BigNumber(0) };
    mockOpenDrawer.mockImplementation(({ onAccountSelected }) =>
      onAccountSelected(emptyUsdc, ethAccount),
    );
    const { user } = renderWithdraw();

    await user.press(screen.getByTestId("perps-withdraw-select-currency"));

    expect(await screen.findByText("Withdraw to USDC")).toBeOnTheScreen();
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
