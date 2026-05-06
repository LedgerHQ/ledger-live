import { renderHook } from "@tests/test-renderer";
import { useAssetMarketData } from "../useAssetMarketData";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/marketApi";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { marketCurrencyData } from "../../__fixtures__/marketCurrencyData";

jest.mock("@ledgerhq/live-common/market/state-manager/marketApi", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/marketApi"),
  useGetCurrencyDataQuery: jest.fn(),
}));

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);

describe("useAssetMarketData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetCurrencyDataQuery.mockReturnValue({
      data: marketCurrencyData,
      isFetching: false,
      isError: false,
    } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);
  });

  describe("data forwarding", () => {
    it("returns marketCurrency from the query", () => {
      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.marketCurrency).toBe(marketCurrencyData);
    });

    it("returns counterCurrency from market params", () => {
      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.counterCurrency).toBe("USD");
    });
  });

  describe("loading state", () => {
    it("reflects isFetching from the query", () => {
      mockUseGetCurrencyDataQuery.mockReturnValue({
        data: undefined,
        isFetching: true,
        isError: false,
      } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("error state", () => {
    it("reflects isError from the query", () => {
      mockUseGetCurrencyDataQuery.mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: true,
      } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("skip query", () => {
    it("skips the query when currency is undefined", () => {
      renderHook(() => useAssetMarketData(undefined));

      expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
        expect.objectContaining({ id: "" }),
        expect.objectContaining({ skip: true }),
      );
    });

    it("passes the currency id to the query", () => {
      renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
        expect.objectContaining({ id: "bitcoin" }),
        expect.objectContaining({ skip: false }),
      );
    });
  });
});
