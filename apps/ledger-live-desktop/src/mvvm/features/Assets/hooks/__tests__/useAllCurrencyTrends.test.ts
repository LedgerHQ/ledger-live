import { renderHook } from "tests/testSetup";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  getCurrencyPortfolio,
  getCurrentBalanceCountervalueChange,
} from "@ledgerhq/live-countervalues/portfolio";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { CurrencyPortfolio } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  BITCOIN_ASSET,
  ETHEREUM_ASSET,
  STABLECOIN_ASSET,
} from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import type { AssetTableItem } from "../../types";
import { useAllCurrencyTrends } from "../useAllCurrencyTrends";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCountervaluesState: jest.fn(),
}));
jest.mock("@ledgerhq/live-countervalues/portfolio", () => ({
  getCurrencyPortfolio: jest.fn(),
  getCurrentBalanceCountervalueChange: jest.fn(),
}));

const mockedUseCountervaluesState = jest.mocked(useCountervaluesState);
const mockedGetCurrencyPortfolio = jest.mocked(getCurrencyPortfolio);
const mockedGetCurrentBalanceCountervalueChange = jest.mocked(getCurrentBalanceCountervalueChange);

const mockCounterValueCurrency = getFiatCurrencyByTicker("USD");
const mockCountervaluesState: CounterValuesState = {
  data: {},
  status: {},
  cache: {},
};

const makePortfolio = (percentage?: number): CurrencyPortfolio => ({
  history: [],
  countervalueAvailable: true,
  histories: [],
  accounts: [],
  range: "day",
  cryptoChange: { value: 0, percentage: null },
  countervalueChange: { percentage, value: 0 },
});

const initialState = {
  settings: {
    counterValue: "USD",
  },
};

function makeAssetItem(overrides: Partial<AssetTableItem>): AssetTableItem {
  return {
    ...BITCOIN_ASSET,
    isPlaceholder: false,
    ...overrides,
  };
}

describe("useAllCurrencyTrends", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCountervaluesState.mockReturnValue(mockCountervaluesState);
    mockedGetCurrentBalanceCountervalueChange.mockReturnValue({ value: 0, percentage: null });
  });

  it("should compute trends for all real items with one shared countervalues subscription", () => {
    const bitcoinAccount = genAccount("btc-trend", { currency: getCryptoCurrencyById("bitcoin") });
    const ethereumAccount = genAccount("eth-trend", {
      currency: getCryptoCurrencyById("ethereum"),
    });
    const cardano = getCryptoCurrencyById("cardano");
    const bitcoinAccounts = [bitcoinAccount];
    const ethereumAccounts = [ethereumAccount];

    const items: AssetTableItem[] = [
      {
        ...BITCOIN_ASSET,
        accounts: bitcoinAccounts,
        isPlaceholder: false,
      },
      {
        ...ETHEREUM_ASSET,
        accounts: ethereumAccounts,
        isPlaceholder: false,
      },
      {
        ...STABLECOIN_ASSET,
        isPlaceholder: true,
      },
      makeAssetItem({
        currency: cardano,
        accounts: [],
      }),
    ];

    mockedGetCurrencyPortfolio.mockReturnValueOnce(makePortfolio(12.34));
    mockedGetCurrencyPortfolio.mockReturnValueOnce(makePortfolio(-5.67));

    const range = "week" as const;
    const { result } = renderHook(() => useAllCurrencyTrends(items, range), { initialState });

    expect(mockedUseCountervaluesState).toHaveBeenCalledTimes(1);
    expect(mockedGetCurrencyPortfolio).toHaveBeenCalledTimes(2);
    expect(mockedGetCurrencyPortfolio).toHaveBeenNthCalledWith(
      1,
      bitcoinAccounts,
      range,
      mockCountervaluesState,
      mockCounterValueCurrency,
    );
    expect(mockedGetCurrencyPortfolio).toHaveBeenNthCalledWith(
      2,
      ethereumAccounts,
      range,
      mockCountervaluesState,
      mockCounterValueCurrency,
    );

    expect(result.current.get(BITCOIN_ASSET.currency.id)).toBe(12.34);
    expect(result.current.get(ETHEREUM_ASSET.currency.id)).toBe(-5.67);
    expect(result.current.get(STABLECOIN_ASSET.currency.id)).toBeNull();
    expect(result.current.get(cardano.id)).toBeNull();
  });

  it("should return null when both portfolio change and balance fallback are unavailable", () => {
    const bitcoinAccount = genAccount("btc-undefined-trend", {
      currency: getCryptoCurrencyById("bitcoin"),
    });

    mockedGetCurrencyPortfolio.mockReturnValueOnce(makePortfolio(undefined));
    mockedGetCurrentBalanceCountervalueChange.mockReturnValueOnce({ value: 0, percentage: null });

    const { result } = renderHook(
      () =>
        useAllCurrencyTrends(
          [
            {
              ...BITCOIN_ASSET,
              accounts: [bitcoinAccount],
              isPlaceholder: false,
            },
          ],
          "month",
        ),
      { initialState },
    );

    expect(result.current.get(BITCOIN_ASSET.currency.id)).toBeNull();
  });

  it("should fall back to the current-balance price change when portfolio change is unavailable", () => {
    const bitcoinAccount = genAccount("btc-fallback-trend", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const bitcoinAccounts = [bitcoinAccount];

    mockedGetCurrencyPortfolio.mockReturnValueOnce(makePortfolio(undefined));
    mockedGetCurrentBalanceCountervalueChange.mockReturnValueOnce({ value: 42, percentage: 3.21 });

    const range = "day" as const;
    const { result } = renderHook(
      () =>
        useAllCurrencyTrends(
          [
            {
              ...BITCOIN_ASSET,
              accounts: bitcoinAccounts,
              isPlaceholder: false,
            },
          ],
          range,
        ),
      { initialState },
    );

    expect(mockedGetCurrentBalanceCountervalueChange).toHaveBeenCalledWith(
      bitcoinAccounts,
      range,
      mockCountervaluesState,
      mockCounterValueCurrency,
    );
    expect(result.current.get(BITCOIN_ASSET.currency.id)).toBe(3.21);
  });

  it("should not use the balance fallback when the portfolio change is available", () => {
    const bitcoinAccount = genAccount("btc-no-fallback-trend", {
      currency: getCryptoCurrencyById("bitcoin"),
    });

    mockedGetCurrencyPortfolio.mockReturnValueOnce(makePortfolio(7.89));

    const { result } = renderHook(
      () =>
        useAllCurrencyTrends(
          [
            {
              ...BITCOIN_ASSET,
              accounts: [bitcoinAccount],
              isPlaceholder: false,
            },
          ],
          "day",
        ),
      { initialState },
    );

    expect(mockedGetCurrentBalanceCountervalueChange).not.toHaveBeenCalled();
    expect(result.current.get(BITCOIN_ASSET.currency.id)).toBe(7.89);
  });
});
