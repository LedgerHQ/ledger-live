import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen } from "@tests/test-renderer";
import PerpsDepositScreen from "../PerpsDepositScreen";

const mockOpenDrawer = jest.fn();
jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

// Countervalues are priced 1:1 with the account balance so the form ceiling is
// predictable: a balance of 10_000 (2 decimals for USD) means a $100 maximum.
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
  useCountervaluesState: () => ({}),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: () => 20000000000000000,
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: () => mockUsePerpsDepositQuote(),
}));

function createAccount(id: string, spendableBalance: number): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById("ethereum"), operationsSize: 0 }),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  };
}

const receiverAccount = createAccount("receiver-1", 0);
const fundingAccount = createAccount("funding-1", 10000);

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() };
const mockRoute = { params: { receiverAccount } };

/** The funding account is read back from the store, so it has to live there. */
function renderDeposit() {
  return render(
    <PerpsDepositScreen navigation={mockNavigation as never} route={mockRoute as never} />,
    {
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [fundingAccount] },
      }),
    },
  );
}

describe("PerpsDeposit integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42) },
      isLoading: false,
      isUnavailable: false,
    });
  });

  it("should let the user pick a funding account before reviewing", async () => {
    const { user } = renderDeposit();

    expect(screen.getByTestId("perps-deposit-amount-input")).toBeOnTheScreen();
    // No funding account and no amount yet, so the review CTA stays disabled.
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();

    await user.press(screen.getByTestId("perps-deposit-select-currency"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ uiUseCase: "perpetuals:fund" }),
    );
  });

  it("should type the amount with the in-app keypad", async () => {
    const { user } = renderDeposit();

    await user.press(screen.getByTestId("perps-deposit-key-5"));
    await user.press(screen.getByTestId("perps-deposit-key-0"));

    expect(screen.getByTestId("perps-deposit-amount-input").props.value).toBe("50");

    await user.press(screen.getByTestId("perps-deposit-key-delete"));

    expect(screen.getByTestId("perps-deposit-amount-input").props.value).toBe("5");
  });

  it("should enable the review CTA once a funding account and amount are entered", async () => {
    const { user } = renderDeposit();

    await user.press(screen.getByTestId("perps-deposit-select-currency"));
    const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
    act(() => onAccountSelected(fundingAccount));

    await user.press(screen.getByTestId("perps-deposit-key-2"));
    await user.press(screen.getByTestId("perps-deposit-key-0"));

    expect(screen.getByTestId("perps-deposit-review-cta")).not.toBeDisabled();
  });

  it("should only advertise the provider once an amount is entered", async () => {
    const { user } = renderDeposit();

    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeOnTheScreen();

    await user.press(screen.getByTestId("perps-deposit-select-currency"));
    const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
    act(() => onAccountSelected(fundingAccount));

    await user.press(screen.getByTestId("perps-deposit-key-2"));
    await user.press(screen.getByTestId("perps-deposit-key-0"));

    expect(screen.getByText("Swap and deposit via SwapKit")).toBeOnTheScreen();
  });

  it("should tell the user when the provider has no quote for the pair", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: false,
      isUnavailable: true,
    });
    const { user } = renderDeposit();

    await user.press(screen.getByTestId("perps-deposit-select-currency"));
    const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
    act(() => onAccountSelected(fundingAccount));

    await user.press(screen.getByTestId("perps-deposit-key-2"));
    await user.press(screen.getByTestId("perps-deposit-key-0"));

    expect(screen.getByTestId("perps-deposit-form-error")).toHaveTextContent(
      "We can’t get a quote from SwapKit, try with a different asset or come back later.",
    );
    // The message replaces the provider notice instead of stacking with it.
    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeOnTheScreen();
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();
  });

  it("should shimmer the quoted amount and keep the CTA disabled while quoting", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: true,
      isUnavailable: false,
    });
    const { user } = renderDeposit();

    await user.press(screen.getByTestId("perps-deposit-select-currency"));
    const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
    act(() => onAccountSelected(fundingAccount));

    await user.press(screen.getByTestId("perps-deposit-key-2"));
    await user.press(screen.getByTestId("perps-deposit-key-0"));

    expect(screen.getByTestId("perps-deposit-quote-skeleton")).toBeOnTheScreen();
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();
  });
});
