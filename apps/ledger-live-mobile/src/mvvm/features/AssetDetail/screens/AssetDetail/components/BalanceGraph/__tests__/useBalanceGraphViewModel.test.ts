import { renderHook, act } from "@tests/test-renderer";
import { useBalanceGraphViewModel } from "../useBalanceGraphViewModel";
import { track } from "~/analytics";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/marketApi";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";
import type { State } from "~/reducers/types";
import { marketCurrencyData } from "../../../__fixtures__/marketCurrencyData";

jest.mock("@ledgerhq/live-common/market/state-manager/marketApi", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/marketApi"),
  useGetCurrencyDataQuery: jest.fn(),
}));
jest.mock("LLM/features/Receive");

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);
const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);
const mockHandleOpenReceiveDrawer = jest.fn();

function withAccounts(accounts: Array<{ currencyId: string; balance: number }>) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: accounts.map((a, i) => {
          const currency =
            a.currencyId === "bitcoin" ? mockBtcCryptoCurrency : mockEthCryptoCurrency;
          const account = genAccount(`${a.currencyId}-${i}`, {
            currency,
            operationsSize: 0,
          });
          account.balance = new BigNumber(a.balance);
          account.spendableBalance = new BigNumber(a.balance);
          return account;
        }),
      },
    }),
  };
}

describe("useBalanceGraphViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetCurrencyDataQuery.mockReturnValue({
      data: marketCurrencyData,
      isFetching: false,
    } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
    });
  });

  describe("price & trend", () => {
    it("exposes price and the 24h change percentage by default", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.price).toBe(50000);
      expect(result.current.priceChangePercentage).toBe(2.35);
    });

    it("returns price=0 and hasMarketData=false when no market data", () => {
      mockUseGetCurrencyDataQuery.mockReturnValue({
        data: undefined,
        isFetching: false,
      } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.price).toBe(0);
      expect(result.current.hasMarketData).toBe(false);
      expect(result.current.priceChangePercentage).toBe(0);
    });

    it("uses the correct priceChangePercentage key after range change", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      act(() => result.current.onRangeChange("7d"));
      expect(result.current.priceChangePercentage).toBe(-5.12);

      act(() => result.current.onRangeChange("1y"));
      expect(result.current.priceChangePercentage).toBe(150.0);
    });
  });

  describe("priceFormatter (formatCurrencyUnitFragment)", () => {
    it("splits a USD-formatted value into FormattedValue parts", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      const formatted = result.current.priceFormatter(1234.56);

      expect(formatted.integerPart).toBe("1,234");
      expect(formatted.decimalPart).toBe("56");
      expect(formatted.decimalSeparator).toBe(".");
      expect(formatted.currencyText).toBe("$");
    });
  });

  describe("formattedPriceChange", () => {
    it("returns a signed currency string for a positive change", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.formattedPriceChange).toMatch(/^\+/);
    });

    it("returns a minus-prefixed string for a negative change", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      act(() => result.current.onRangeChange("7d"));

      expect(result.current.formattedPriceChange).toMatch(/^-/);
    });

    it("returns undefined when no market data", () => {
      mockUseGetCurrencyDataQuery.mockReturnValue({
        data: undefined,
        isFetching: false,
      } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.formattedPriceChange).toBeUndefined();
    });
  });

  describe("onRangeChange", () => {
    it("updates selectedRange and fires analytics", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.selectedRange).toBe("24h");

      act(() => result.current.onRangeChange("30d"));

      expect(result.current.selectedRange).toBe("30d");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "timeframe",
        timeframe: "30d",
        page: "Asset Detail",
        currency: "bitcoin",
      });
    });

    it("does not fire analytics when selecting the same range", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      act(() => result.current.onRangeChange("24h"));

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("showReceive", () => {
    it("is false when currency is undefined", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(undefined));

      expect(result.current.showReceive).toBe(false);
    });

    it("is true when the asset has no funds but another asset does", () => {
      const { result } = renderHook(
        () => useBalanceGraphViewModel(mockBtcCryptoCurrency),
        withAccounts([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(true);
    });

    it("is false when the asset already has funds", () => {
      const { result } = renderHook(
        () => useBalanceGraphViewModel(mockBtcCryptoCurrency),
        withAccounts([
          { currencyId: "bitcoin", balance: 500 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when the wallet has no funds at all", () => {
      const { result } = renderHook(
        () => useBalanceGraphViewModel(mockBtcCryptoCurrency),
        withAccounts([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 0 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when hideReceive is true even if conditions are met", () => {
      const { result } = renderHook(
        () => useBalanceGraphViewModel(mockBtcCryptoCurrency, true),
        withAccounts([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });
  });

  describe("onReceivePress", () => {
    it("tracks analytics and opens the receive drawer", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      act(() => result.current.onReceivePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "receive",
        page: "Asset Detail",
        currency: "bitcoin",
      });
      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    });
  });

  describe("ranges", () => {
    it("exposes translated range options in chronological order (24h first, 1y last)", () => {
      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      const values = result.current.ranges.map(r => r.value);
      expect(values).toEqual(["24h", "7d", "30d", "1y"]);
    });
  });

  describe("isLoading", () => {
    it("reflects the fetching state of useCurrencyData", () => {
      mockUseGetCurrencyDataQuery.mockReturnValue({
        data: undefined,
        isFetching: true,
      } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

      const { result } = renderHook(() => useBalanceGraphViewModel(mockBtcCryptoCurrency));

      expect(result.current.isLoading).toBe(true);
    });
  });
});
