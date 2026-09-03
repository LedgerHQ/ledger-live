/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type {
  Account,
  AccountLike,
  AccountPortfolio,
  AssetsDistribution,
  CurrencyPortfolio,
  Portfolio,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Currency } from "@domain/entity-currency";
import {
  useBalanceHistoryWithCountervalue,
  usePortfolio,
  usePortfolioThrottled,
  useCurrencyPortfolio,
  useDistribution,
} from "../portfolioReact";

const mockCvState = {} as CounterValuesState;
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesState: () => mockCvState,
}));

const mockThrottledValues = jest.fn();
jest.mock("@ledgerhq/live-hooks/useThrottledFunction", () => ({
  useThrottledValues: (...args: unknown[]) => mockThrottledValues(...args),
}));

const mockGetBalanceHistoryWithCountervalue = jest.fn();
const mockGetPortfolio = jest.fn();
const mockGetCurrencyPortfolio = jest.fn();
const mockGetAssetsDistribution = jest.fn();
const mockGetPortfolioCount = jest.fn();
const mockFlattenAccounts = jest.fn((accounts: AccountLike[]) => accounts);
const mockGetAccountCurrency = jest.fn();

jest.mock("../portfolio", () => ({
  getBalanceHistoryWithCountervalue: (...args: unknown[]) =>
    mockGetBalanceHistoryWithCountervalue(...args),
  getPortfolio: (...args: unknown[]) => mockGetPortfolio(...args),
  getCurrencyPortfolio: (...args: unknown[]) => mockGetCurrencyPortfolio(...args),
  getAssetsDistribution: (...args: unknown[]) => mockGetAssetsDistribution(...args),
  getPortfolioCount: (...args: unknown[]) => mockGetPortfolioCount(...args),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  flattenAccounts: (accounts: AccountLike[]) => mockFlattenAccounts(accounts),
  getAccountCurrency: (account: AccountLike) => mockGetAccountCurrency(account),
}));

const makeCurrency = (id: string, ticker: string): Currency =>
  ({ type: "FiatCurrency", id, ticker }) as unknown as Currency;

const makeCryptoCurrency = (id: string, ticker: string): CryptoCurrency =>
  ({ type: "CryptoCurrency", id, ticker }) as unknown as CryptoCurrency;

const makeAccount = (id: string): AccountLike =>
  ({
    type: "Account",
    id,
    balance: { toNumber: () => 100, isGreaterThan: () => true },
    spendableBalance: { toNumber: () => 100 },
    subAccounts: [],
  }) as unknown as AccountLike;

const usd = makeCurrency("usd", "USD");
const btc = makeCryptoCurrency("bitcoin", "BTC");

const emptyPortfolio: Portfolio = {
  balanceHistory: [],
  balanceAvailable: false,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day",
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange: { percentage: null, value: 0 },
};

const emptyCurrencyPortfolio: CurrencyPortfolio = {
  history: [],
  countervalueAvailable: false,
  accounts: [],
  range: "day",
  histories: [],
  cryptoChange: { value: 0, percentage: null },
  countervalueChange: { percentage: null, value: 0 },
};

const emptyAccountPortfolio: AccountPortfolio = {
  history: [],
  countervalueAvailable: false,
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  cryptoChange: { value: 0, percentage: null },
  countervalueChange: { percentage: null, value: 0 },
};

const emptyDistribution: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};

describe("useBalanceHistoryWithCountervalue", () => {
  const account = makeAccount("acc-1");

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPortfolioCount.mockReturnValue(7);
    mockGetBalanceHistoryWithCountervalue.mockReturnValue(emptyAccountPortfolio);
  });

  it("calls getBalanceHistoryWithCountervalue with state and count", () => {
    const { result } = renderHook(() =>
      useBalanceHistoryWithCountervalue({ account, range: "day", to: usd }),
    );

    expect(mockGetPortfolioCount).toHaveBeenCalledWith([account], "day");
    expect(mockGetBalanceHistoryWithCountervalue).toHaveBeenCalledWith(
      account,
      "day",
      7,
      mockCvState,
      usd,
    );
    expect(result.current).toBe(emptyAccountPortfolio);
  });
});

describe("usePortfolio", () => {
  const accounts = [makeAccount("acc-1"), makeAccount("acc-2")];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPortfolio.mockReturnValue(emptyPortfolio);
  });

  it("calls getPortfolio with countervalue state", () => {
    const { result } = renderHook(() => usePortfolio({ accounts, range: "week", to: usd }));

    expect(mockGetPortfolio).toHaveBeenCalledWith(accounts, "week", mockCvState, usd, undefined);
    expect(result.current).toBe(emptyPortfolio);
  });

  it("forwards options to getPortfolio", () => {
    renderHook(() =>
      usePortfolio({
        accounts,
        range: "month",
        to: usd,
        options: { flattenSourceAccounts: false },
      }),
    );

    expect(mockGetPortfolio).toHaveBeenCalledWith(accounts, "month", mockCvState, usd, {
      flattenSourceAccounts: false,
    });
  });
});

describe("usePortfolioThrottled", () => {
  const accounts = [makeAccount("acc-1")];

  beforeEach(() => {
    jest.clearAllMocks();
    mockThrottledValues.mockReturnValue([mockCvState, accounts]);
    mockGetPortfolio.mockReturnValue(emptyPortfolio);
  });

  it("returns portfolio computed from throttled inputs", () => {
    const { result } = renderHook(() => usePortfolioThrottled({ accounts, range: "day", to: usd }));

    expect(mockGetPortfolio).toHaveBeenCalled();
    expect(result.current).toBe(emptyPortfolio);
  });

  it("recomputes portfolio when throttled inputs change", () => {
    const { rerender } = renderHook(() =>
      usePortfolioThrottled({ accounts, range: "day", to: usd }),
    );

    const portfolioWithBalance: Portfolio = {
      ...emptyPortfolio,
      balanceAvailable: true,
      availableAccounts: accounts as Account[],
    };
    mockGetPortfolio.mockReturnValue(portfolioWithBalance);

    const newState = { data: { btc: new Map() }, status: {}, cache: {} } as CounterValuesState;
    mockThrottledValues.mockReturnValue([newState, accounts]);

    act(() => {
      rerender({});
    });

    expect(mockGetPortfolio).toHaveBeenCalledTimes(2);
  });
});

describe("useCurrencyPortfolio", () => {
  const account = makeAccount("acc-1") as Account;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlattenAccounts.mockReturnValue([account]);
    mockGetAccountCurrency.mockReturnValue(btc);
    mockGetCurrencyPortfolio.mockReturnValue(emptyCurrencyPortfolio);
  });

  it("filters flattened accounts by currency and calls getCurrencyPortfolio", () => {
    const { result } = renderHook(() =>
      useCurrencyPortfolio({ accounts: [account], range: "day", to: usd, currency: btc }),
    );

    expect(mockFlattenAccounts).toHaveBeenCalledWith([account]);
    expect(mockGetCurrencyPortfolio).toHaveBeenCalledWith([account], "day", mockCvState, usd);
    expect(result.current).toBe(emptyCurrencyPortfolio);
  });

  it("excludes accounts whose currency does not match", () => {
    const eth = makeCryptoCurrency("ethereum", "ETH");
    mockGetAccountCurrency.mockReturnValue(eth);

    renderHook(() =>
      useCurrencyPortfolio({ accounts: [account], range: "day", to: usd, currency: btc }),
    );

    expect(mockGetCurrencyPortfolio).toHaveBeenCalledWith([], "day", mockCvState, usd);
  });
});

describe("useDistribution", () => {
  const accounts = [makeAccount("acc-1") as Account];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAssetsDistribution.mockReturnValue(emptyDistribution);
  });

  it("returns empty distribution when skip is true", () => {
    const { result } = renderHook(() => useDistribution({ accounts, to: usd, skip: true }));

    expect(mockGetAssetsDistribution).not.toHaveBeenCalled();
    expect(result.current).toEqual({ isAvailable: false, list: [], showFirst: 0, sum: 0 });
  });

  it("calls getAssetsDistribution with countervalue state and opts", () => {
    const distribution: AssetsDistribution = {
      isAvailable: true,
      list: [],
      showFirst: 0,
      sum: 1000,
    };
    mockGetAssetsDistribution.mockReturnValue(distribution);

    const { result } = renderHook(() => useDistribution({ accounts, to: usd }));

    expect(mockGetAssetsDistribution).toHaveBeenCalledWith(accounts, mockCvState, usd, {
      minShowFirst: 6,
      maxShowFirst: 6,
      showFirstThreshold: 0.95,
      showEmptyAccounts: false,
      hideEmptyTokenAccount: false,
    });
    expect(result.current).toBe(distribution);
  });

  it("passes showEmptyAccounts and hideEmptyTokenAccount flags", () => {
    renderHook(() =>
      useDistribution({ accounts, to: usd, showEmptyAccounts: true, hideEmptyTokenAccount: true }),
    );

    expect(mockGetAssetsDistribution).toHaveBeenCalledWith(
      accounts,
      mockCvState,
      usd,
      expect.objectContaining({ showEmptyAccounts: true, hideEmptyTokenAccount: true }),
    );
  });
});
