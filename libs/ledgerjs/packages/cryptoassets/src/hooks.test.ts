/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useTokenById, useTokenByAddressInCurrency, useCurrencyById } from "./hooks";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Mock the currencies module
jest.mock("./currencies", () => ({
  findCryptoCurrencyById: jest.fn(),
}));

// Mock the RTK Query hooks
jest.mock("./cal-client/state-manager/api", () => ({
  cryptoAssetsApi: {
    useFindTokenByIdQuery: jest.fn(),
    useFindTokenByAddressInCurrencyQuery: jest.fn(),
  },
}));

import { findCryptoCurrencyById } from "./currencies";
import { cryptoAssetsApi } from "./cal-client/state-manager/api";

// Mock crypto currency data
const mockCryptoCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [
    {
      code: "BTC",
      name: "Bitcoin",
      magnitude: 8,
    },
  ],
  family: "bitcoin",
  managerAppName: "Bitcoin",
  coinType: 0,
  scheme: "bitcoin",
  color: "#FF9900",
  explorerViews: [],
};

// Mock token data
const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_coin",
  ledgerSignature: "3045022100...",
  contractAddress: "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4",
  parentCurrency: {
    type: "CryptoCurrency",
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    units: [],
    family: "ethereum",
    managerAppName: "Ethereum",
    coinType: 60,
    scheme: "ethereum",
    color: "#627EEA",
    explorerViews: [],
  },
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      code: "USDC",
      name: "USD Coin",
      magnitude: 6,
    },
  ],
};

// Setup mock implementations
const mockFindCryptoCurrencyById = findCryptoCurrencyById as jest.MockedFunction<
  typeof findCryptoCurrencyById
>;
const mockUseFindTokenByIdQuery = cryptoAssetsApi.useFindTokenByIdQuery as jest.MockedFunction<
  typeof cryptoAssetsApi.useFindTokenByIdQuery
>;
const mockUseFindTokenByAddressInCurrencyQuery =
  cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery as jest.MockedFunction<
    typeof cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery
  >;

beforeEach(() => {
  jest.clearAllMocks();

  mockFindCryptoCurrencyById.mockImplementation((id: string) => {
    if (id === "bitcoin") {
      return mockCryptoCurrency;
    }
    return undefined;
  });

  // Default mock implementations
  mockUseFindTokenByIdQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: undefined,
  } as any);

  mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: undefined,
  } as any);
});

describe("Hooks", () => {
  describe("useTokenById", () => {
    it("should return token data", () => {
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: mockToken,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useTokenById("ethereum/erc20/usd_coin"));

      expect(result.current.token).toBe(mockToken);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(mockUseFindTokenByIdQuery).toHaveBeenCalledWith({ id: "ethereum/erc20/usd_coin" });
    });

    it("should handle loading state", () => {
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useTokenById("ethereum/erc20/usd_coin"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle error state", () => {
      const mockError = { status: 404, data: "Not found" };
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHook(() => useTokenById("non-existent"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    it("should handle undefined token", () => {
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useTokenById("non-existent"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("useTokenByAddressInCurrency", () => {
    it("should return token data", () => {
      mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
        data: mockToken,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() =>
        useTokenByAddressInCurrency("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ethereum"),
      );

      expect(result.current.token).toBe(mockToken);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(mockUseFindTokenByAddressInCurrencyQuery).toHaveBeenCalledWith({
        contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        network: "ethereum",
      });
    });

    it("should handle loading state", () => {
      mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      const { result } = renderHook(() =>
        useTokenByAddressInCurrency("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ethereum"),
      );

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle error state", () => {
      const mockError = { status: 404, data: "Not found" };
      mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHook(() => useTokenByAddressInCurrency("0xNonExistent", "ethereum"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    it("should handle undefined token", () => {
      mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useTokenByAddressInCurrency("0xNonExistent", "ethereum"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("useCurrencyById", () => {
    it("should return crypto currency when found", () => {
      mockFindCryptoCurrencyById.mockReturnValue(mockCryptoCurrency);

      const { result } = renderHook(() => useCurrencyById("bitcoin"));

      expect(result.current.currency).toBe(mockCryptoCurrency);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFindCryptoCurrencyById).toHaveBeenCalledWith("bitcoin");
      // Should not call the API when crypto currency is found
      expect(mockUseFindTokenByIdQuery).not.toHaveBeenCalled();
    });

    it("should fallback to token API when crypto currency not found", () => {
      mockFindCryptoCurrencyById.mockReturnValue(undefined);
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: mockToken,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useCurrencyById("ethereum/erc20/usd_coin"));

      expect(result.current.currency).toBe(mockToken);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(mockFindCryptoCurrencyById).toHaveBeenCalledWith("ethereum/erc20/usd_coin");
      expect(mockUseFindTokenByIdQuery).toHaveBeenCalledWith({ id: "ethereum/erc20/usd_coin" });
    });

    it("should handle loading state when fetching token", () => {
      mockFindCryptoCurrencyById.mockReturnValue(undefined);
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useCurrencyById("ethereum/erc20/usd_coin"));

      expect(result.current.currency).toBeUndefined();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle error state when fetching token", () => {
      mockFindCryptoCurrencyById.mockReturnValue(undefined);
      const mockError = { status: 500, data: "Server error" };
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHook(() => useCurrencyById("ethereum/erc20/usd_coin"));

      expect(result.current.currency).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });

    it("should handle undefined currency and token", () => {
      mockFindCryptoCurrencyById.mockReturnValue(undefined);
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useCurrencyById("non-existent"));

      expect(result.current.currency).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });
});
