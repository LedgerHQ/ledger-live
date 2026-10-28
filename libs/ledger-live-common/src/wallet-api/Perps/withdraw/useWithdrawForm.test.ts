/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { usdcToken } from "../../../modularDrawer/__mocks__/currencies.mock";
import {
  WithdrawAddressScreeningError,
  WithdrawApiError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
} from "./errors";
import { usePerpsWithdrawForm, type PerpsWithdrawFormParams } from "./useWithdrawForm";

// 1 USDC (6 decimals) is worth 2 of the counter value (2 decimals); other assets are priced 1:1.
const USDC_TO_FIAT = 2 / 10_000;
const isHyperCore = (currency: unknown) =>
  typeof currency === "object" &&
  currency !== null &&
  "id" in currency &&
  currency.id === "hypercore";

const priceCountervalue = (currency: unknown, value: BigNumber): BigNumber | undefined =>
  isHyperCore(currency) ? value.times(USDC_TO_FIAT) : value;
const mockCalculateCountervalue = jest.fn(priceCountervalue);
jest.mock("@features/platform-market-countervalues", () => ({
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
  useCountervaluesCache: () => ({}),
}));

const mockCalculate = jest.fn(
  (_state: unknown, { from, value }: { from: unknown; value: number }): number | null =>
    isHyperCore(from) ? value / USDC_TO_FIAT : value,
);
jest.mock("@domain/entity-market-countervalues", () => ({
  calculate: (state: unknown, params: { from: unknown; value: number }) =>
    mockCalculate(state, params),
}));

const mockUseWithdrawCurrencies = jest.fn();
jest.mock("./useWithdrawCurrencies", () => ({
  useWithdrawCurrencies: () => mockUseWithdrawCurrencies(),
}));

const mockUsePerpsWithdrawQuote = jest.fn();
jest.mock("./useWithdrawQuote", () => ({
  usePerpsWithdrawQuote: (params: unknown) => mockUsePerpsWithdrawQuote(params),
}));

function createAccount(id: string, currencyId: string, balance: BigNumber.Value): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 }),
    spendableBalance: new BigNumber(balance),
    balance: new BigNumber(balance),
  };
}

// 1000.5 USDC, worth $2,001.00.
const sourceAccount = createAccount("source-1", "hypercore", "1000500000");
const ethAccount = createAccount("eth-1", "ethereum", 100_000);
const btcAccount = createAccount("btc-1", "bitcoin", 50_000);
const accounts: AccountLike[] = [sourceAccount, ethAccount, btcAccount];

const quote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: Date.now() + 60_000,
};

const baseParams: PerpsWithdrawFormParams = {
  sourceAccount,
  accounts,
  amount: 0,
  picked: undefined,
  counterValueCurrency: getFiatCurrencyByTicker("USD"),
  locale: "en-US",
  discreet: false,
};

const renderForm = (overrides: Partial<PerpsWithdrawFormParams> = {}) =>
  renderHook(() => usePerpsWithdrawForm({ ...baseParams, ...overrides })).result.current;

const lastQuoteRequest = () => mockUsePerpsWithdrawQuote.mock.lastCall?.[0];

describe("usePerpsWithdrawForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateCountervalue.mockImplementation(priceCountervalue);
    mockUseWithdrawCurrencies.mockReturnValue({
      currencyIds: ["ethereum", "bitcoin"],
      isError: false,
    });
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote, isLoading: false, error: null });
  });

  it("quotes the typed counter value as USDC towards the default destination", () => {
    const form = renderForm({ amount: 500 });

    expect(lastQuoteRequest()).toEqual({
      amount: "250",
      sourceAccount,
      destinationAccount: ethAccount,
      accounts,
      counterValueCurrency: "USD",
    });
    expect(form.destinationAccount).toBe(ethAccount);
    expect(form.statusError).toBeNull();
    expect(form.canReview).toBe(true);
  });

  it("shows the balance, the destination's value and the amount received", () => {
    const form = renderForm({ amount: 500 });

    expect(form.formattedAvailable).toBe("$2,001.00");
    expect(form.destinationCounterValue).toBe("$1,000.00");
    expect(form.quotedAmount).toMatch(/^0\.3\sETH$/);
  });

  it("keeps the 1 USDC fee out of Max, in the counter value", () => {
    expect(renderForm().maxAmount).toBe(1999);
  });

  it("does not allow Review without an amount", () => {
    const form = renderForm();

    expect(lastQuoteRequest()).toMatchObject({ amount: "0" });
    expect(form.canReview).toBe(false);
  });

  it("flags an amount that leaves no room for the fee, without quoting it", () => {
    const form = renderForm({ amount: 2000 });

    expect(form.exceedsBalance).toBe(true);
    expect(form.statusError).toEqual({ labelKey: "perpsWithdraw.formErrors.insufficientBalance" });
    expect(lastQuoteRequest()).toMatchObject({ amount: "" });
  });

  it("reports an unavailable quote when the counter value has no rate", () => {
    mockCalculate.mockReturnValueOnce(null);

    const form = renderForm({ amount: 500 });

    expect(form.statusError).toEqual({ labelKey: "perpsWithdraw.formErrors.quoteUnavailable" });
    expect(lastQuoteRequest()).toMatchObject({ amount: "" });
  });

  it("falls back to the USDC balance when it has no counter value", () => {
    mockCalculateCountervalue.mockImplementation(() => undefined);

    const form = renderForm();

    expect(form.formattedAvailable).toMatch(/^1,000\.5\sUSDC$/);
    expect(form.destinationCounterValue).toBeNull();
    expect(form.maxAmount).toBe(0);
  });

  it("blocks the form and has no default when the supported assets cannot be loaded", () => {
    mockUseWithdrawCurrencies.mockReturnValue({ currencyIds: undefined, isError: true });

    const form = renderForm({ amount: 500 });

    expect(form.destinationAccount).toBeUndefined();
    expect(form.statusError).toEqual({
      labelKey: "perpsWithdraw.formErrors.currenciesUnavailable",
    });
  });

  it("uses the store copy of a picked account", () => {
    const stale = { ...btcAccount, spendableBalance: new BigNumber(0) };

    const form = renderForm({ amount: 500, picked: { account: stale } });

    expect(form.destinationAccount).toBe(btcAccount);
    expect(lastQuoteRequest()).toMatchObject({ accounts });
  });

  it("keeps a picked token account the user never held and quotes towards it", () => {
    const emptyUsdc = { ...genTokenAccount(0, ethAccount, usdcToken), balance: new BigNumber(0) };
    const parent = createAccount("eth-new", "ethereum", 0);

    const form = renderForm({ amount: 500, picked: { account: emptyUsdc, parentAccount: parent } });

    expect(form.destinationAccount).toBe(emptyUsdc);
    expect(lastQuoteRequest()).toMatchObject({
      destinationAccount: emptyUsdc,
      accounts: [...accounts, emptyUsdc, parent],
    });
  });

  it("does not allow Review while quoting", () => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: true, error: null });

    const form = renderForm({ amount: 500 });

    expect(form.isQuoteLoading).toBe(true);
    expect(form.quotedAmount).toBeNull();
    expect(form.canReview).toBe(false);
  });

  it.each([
    [
      new WithdrawMinimumAmountError("min", { minAmount: new BigNumber(5) }),
      { labelKey: "perpsWithdraw.formErrors.minimumAmount", values: { minAmount: "5" } },
    ],
    [
      new WithdrawMinimumAmountError("min"),
      { labelKey: "perpsWithdraw.formErrors.minimumAmountUnknown" },
    ],
    [new WithdrawLowLiquidityError("low"), { labelKey: "perpsWithdraw.formErrors.lowLiquidity" }],
    [
      new WithdrawAddressScreeningError("screening"),
      { labelKey: "perpsWithdraw.formErrors.addressScreening" },
    ],
    [new WithdrawApiError("other"), { labelKey: "perpsWithdraw.formErrors.quoteUnavailable" }],
  ])("maps the quote error %#", (error, expected) => {
    mockUsePerpsWithdrawQuote.mockReturnValue({ quote: undefined, isLoading: false, error });

    const form = renderForm({ amount: 500 });

    expect(form.statusError).toEqual(expected);
    expect(form.canReview).toBe(false);
  });
});
