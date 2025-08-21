import { renderHook } from "@testing-library/react";
import { useModularDrawerData } from "../useModularDrawerData";
import { useAssetsData } from "../useAssetsData";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { AssetsDataWithPagination } from "../../data/state-manager/api";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import {
  expectedAssetsSorted,
  expectedCurrenciesByProvider,
  mockCurrencies,
  mockData,
} from "../../__mocks__/useModularDrawerData.mock";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  ApiCryptoCurrency,
  ApiTokenCurrency,
  convertApiAssets,
} from "@ledgerhq/cryptoassets/api-asset-converter";

jest.mock("../useAssetsData");

const mockUseAssetsData = jest.mocked(useAssetsData);

const mockApiResponse: AssetsDataWithPagination = {
  ...mockData,
  cryptoOrTokenCurrencies: convertApiAssets(
    mockData.cryptoOrTokenCurrencies as Record<string, ApiTokenCurrency | ApiCryptoCurrency>,
  ),
  pagination: {
    nextCursor: undefined,
  },
};

describe("useModularDrawerData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when data is successfully loaded", () => {
    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: mockApiResponse,
        error: undefined,
        isLoading: false,
        isSuccess: true,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return the correct data structure", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          searchedValue: undefined,
        }),
      );

      expect(result.current.data).toEqual(mockApiResponse);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeUndefined();
      expect(result.current.loadingStatus).toBe(LoadingStatus.Success);
    });

    it("should process assets data correctly", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          searchedValue: undefined,
        }),
      );

      const { assetsSorted, currenciesByProvider, sortedCryptoCurrencies } = result.current;

      expect(assetsSorted).toBeDefined();
      expect(assetsSorted).toHaveLength(10);
      const assets = assetsSorted?.map(assetData => assetData.asset);
      expect(assets).toEqual(expectedAssetsSorted);

      expect(currenciesByProvider).toBeDefined();
      expect(currenciesByProvider).toHaveLength(10);
      for (let i = 0; i < currenciesByProvider.length; i++) {
        const currencyByProvider = currenciesByProvider[i];
        const expectedCurrencyByProvider = expectedCurrenciesByProvider[i];
        expect(currencyByProvider.providerId).toBe(expectedCurrencyByProvider.providerId);
        expect(currencyByProvider.currenciesByNetwork).toHaveLength(
          expectedCurrencyByProvider.nbCurrenciesByNetwork,
        );
      }

      expect(sortedCryptoCurrencies).toBeDefined();
      expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
      expect(sortedCryptoCurrencies[0].id).toBe("bitcoin");
    });

    it("should handle search functionality", () => {
      const searchValue = "bitcoin";

      renderHook(() =>
        useModularDrawerData({
          searchedValue: searchValue,
        }),
      );

      expect(mockUseAssetsData).toHaveBeenCalledWith({
        search: searchValue,
        currencyIds: expect.any(Array),
      });
    });

    it("should pass correct currency IDs to useAssetsData", () => {
      renderHook(() =>
        useModularDrawerData({
          currencies: mockCurrencies as CryptoOrTokenCurrency[],
          searchedValue: undefined,
        }),
      );

      expect(mockUseAssetsData).toHaveBeenCalledWith({
        search: undefined,
        currencyIds: ["bitcoin", "ethereum", "solana"],
      });
    });
  });

  describe("when data is loading", () => {
    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        isSuccess: false,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return loading state", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          searchedValue: undefined,
        }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.loadingStatus).toBe(LoadingStatus.Pending);
      expect(result.current.assetsSorted).toBeUndefined();
      expect(result.current.currenciesByProvider).toEqual([]);
      expect(result.current.sortedCryptoCurrencies).toEqual([]);
    });
  });

  describe("when there is an error", () => {
    const mockError: FetchBaseQueryError = {
      status: 500,
      data: "Internal server error",
    };

    beforeEach(() => {
      mockUseAssetsData.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        isSuccess: false,
        hasMore: false,
        cursor: undefined,
        loadNext: jest.fn(),
      });
    });

    it("should return error state", () => {
      const { result } = renderHook(() =>
        useModularDrawerData({
          searchedValue: undefined,
        }),
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loadingStatus).toBe(LoadingStatus.Error);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.assetsSorted).toBeUndefined();
      expect(result.current.currenciesByProvider).toEqual([]);
      expect(result.current.sortedCryptoCurrencies).toEqual([]);
    });
  });
});
