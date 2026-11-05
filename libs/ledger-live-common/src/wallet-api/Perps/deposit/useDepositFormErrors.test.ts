/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { act, renderHook } from "@testing-library/react";
import { QuotesErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import type { PerpsDepositQuoteState } from "./useDepositQuote";
import {
  toConvertedDepositAmount,
  usePerpsDepositForm,
  type UsePerpsDepositFormParams,
} from "./useDepositFormErrors";

const mockUsePerpsDepositQuote = jest.fn<PerpsDepositQuoteState, [unknown]>();
jest.mock("./useDepositQuote", () => ({
  usePerpsDepositQuote: (params: unknown) => mockUsePerpsDepositQuote(params),
}));

const mockCancelDepositRequest = jest.fn();
jest.mock("./request", () => ({
  cancelDepositRequest: () => mockCancelDepositRequest(),
}));

const ether = {
  type: "CryptoCurrency",
  id: "arbitrum",
  family: "evm",
  ticker: "ETH",
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
};

const parentAccount = {
  type: "Account",
  id: "js:2:arbitrum:0xfunding:",
  currency: ether,
  spendableBalance: new BigNumber("1000000000000000000"),
} as unknown as Account;

const depositAccount = {
  type: "TokenAccount",
  id: "js:2:arbitrum:0xfunding:+usd_coin",
  parentId: parentAccount.id,
  token: {
    type: "TokenCurrency",
    id: "arbitrum/erc20/usd_coin",
    parentCurrencyId: "arbitrum",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  },
  spendableBalance: new BigNumber("50000000"),
} as unknown as TokenAccount;

const receiverAccount = {
  type: "Account",
  id: "js:2:hypercore:0xreceiver:",
  currency: { ...ether, id: "hypercore", ticker: "USDC" },
  spendableBalance: new BigNumber(0),
} as unknown as Account;

const quoteState = (result: PerpsDepositQuoteState["result"]): PerpsDepositQuoteState => ({
  result,
  isLoading: false,
});
const LOADING: PerpsDepositQuoteState = { result: undefined, isLoading: true };
const AMOUNT_TOO_LOW = quoteState({
  errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "12" }],
});

function renderForm(overrides: Partial<UsePerpsDepositFormParams> = {}) {
  const track = jest.fn();
  const openBuy = jest.fn();
  const params: UsePerpsDepositFormParams = {
    accounts: [parentAccount, depositAccount, receiverAccount],
    receiverAccount,
    depositAccount,
    depositAmount: 20,
    maxAmount: 50,
    toCurrencyAmount: () => new BigNumber("20000000"),
    isOffline: false,
    counterValueCurrency: "USD",
    locale: "en",
    sourceCurrency: "USDC",
    getAccountName: (account: AccountLike) => `name of ${account.id}`,
    track,
    openBuy,
    ...overrides,
  };
  const view = renderHook((props: UsePerpsDepositFormParams) => usePerpsDepositForm(props), {
    initialProps: params,
  });
  return { ...view, params, track, openBuy };
}

const errorEvents = (track: jest.Mock) =>
  track.mock.calls.filter(([event]) => event === "swap error message");

describe("usePerpsDepositForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsDepositQuote.mockReturnValue(
      quoteState({
        quote: { amountTo: new BigNumber(19), quoteId: "q-1", errors: [] },
        errors: [],
      }),
    );
  });

  it("asks for a quote for the converted amount and allows the review of a usable quote", () => {
    const { result } = renderForm();

    expect(mockUsePerpsDepositQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: "20", depositAccount, counterValueCurrency: "USD" }),
    );
    expect(result.current.sentAmount).toBe("20");
    expect(result.current.statusError).toBeNull();
    expect(result.current.canReview).toBe(true);
  });

  it("asks for nothing and blocks the review while the conversion is missing", () => {
    const { result } = renderForm({ toCurrencyAmount: () => null });

    expect(result.current.sentAmount).toBe("");
    expect(result.current.statusError?.code).toBe("noQuotes");
    expect(result.current.canReview).toBe(false);
  });

  it("tracks a new error once, also across the quote reloads in between", () => {
    mockUsePerpsDepositQuote.mockReturnValue(AMOUNT_TOO_LOW);
    const { rerender, params, track } = renderForm();

    mockUsePerpsDepositQuote.mockReturnValue(LOADING);
    rerender({ ...params, depositAmount: 21 });
    mockUsePerpsDepositQuote.mockReturnValue(AMOUNT_TOO_LOW);
    rerender({ ...params, depositAmount: 22 });

    expect(errorEvents(track)).toEqual([
      [
        "swap error message",
        {
          message: "minAmount",
          page: "perps_deposit",
          flow: "perps",
          sourceCurrency: "USDC",
          targetCurrency: "USDC",
        },
      ],
    ]);
  });

  it("keeps the opened details while a quote reload clears the error, until Back", () => {
    mockUsePerpsDepositQuote.mockReturnValue(AMOUNT_TOO_LOW);
    const { result, rerender, params, track } = renderForm();

    act(() => result.current.openDetails());
    mockUsePerpsDepositQuote.mockReturnValue(LOADING);
    rerender({ ...params, depositAmount: 21 });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "learn more" }),
    );
    expect(result.current.isDetailsOpen).toBe(true);
    expect(result.current.details?.titleKey).toBe("perpsDeposit.details.amountTooLow.title");

    act(() => result.current.closeDetails());

    expect(result.current.isDetailsOpen).toBe(false);
  });

  it("cancels the deposit request and opens Buy for the fee account", () => {
    const emptyParent = { ...parentAccount, spendableBalance: new BigNumber(0) };
    const { result, openBuy, track } = renderForm({
      accounts: [emptyParent, depositAccount, receiverAccount],
    });

    expect(result.current.statusError?.code).toBe("notEnoughFees");
    expect(result.current.canLearnMore).toBe(true);

    act(() => result.current.openDetails());
    act(() => result.current.buyFromDetails());

    expect(mockCancelDepositRequest).toHaveBeenCalledTimes(1);
    expect(openBuy).toHaveBeenCalledWith(
      expect.objectContaining({ account: emptyParent, parentAccount: undefined }),
    );
    expect(result.current.isDetailsOpen).toBe(false);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "buy more crypto", currency: "ETH" }),
    );
  });

  it("offers no details and no Buy for an error without them", () => {
    mockUsePerpsDepositQuote.mockReturnValue(
      quoteState({ errors: [{ code: QuotesErrorCodes.NO_QUOTES }] }),
    );
    const { result, openBuy } = renderForm();

    act(() => result.current.openDetails());
    act(() => result.current.buyFromDetails());

    expect(result.current.canLearnMore).toBe(false);
    expect(result.current.isDetailsOpen).toBe(false);
    expect(openBuy).not.toHaveBeenCalled();
  });
});

describe("usePerpsDepositForm refresh and analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsDepositQuote.mockReturnValue(AMOUNT_TOO_LOW);
  });

  it("asks for a new quote of the same draft when refreshQuote runs", () => {
    const { result } = renderForm();
    const before = mockUsePerpsDepositQuote.mock.lastCall?.[0] as { refreshGeneration: number };

    act(() => result.current.refreshQuote());

    const after = mockUsePerpsDepositQuote.mock.lastCall?.[0] as { refreshGeneration: number };
    expect(after.refreshGeneration).toBe(before.refreshGeneration + 1);
  });

  it("tracks the same error again for another funding asset", () => {
    const { rerender, params, track } = renderForm();

    rerender({ ...params, sourceCurrency: "ETH" });

    expect(errorEvents(track).map(([, properties]) => properties.sourceCurrency)).toEqual([
      "USDC",
      "ETH",
    ]);
  });
});

describe("toConvertedDepositAmount", () => {
  it("keeps a missing conversion missing, and never turns it into zero", () => {
    expect(toConvertedDepositAmount(undefined)).toBeNull();
    expect(toConvertedDepositAmount(null)).toBeNull();
    expect(toConvertedDepositAmount(0)?.toFixed()).toBe("0");
  });
});
