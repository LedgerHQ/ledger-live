import { renderHook, waitFor } from "@testing-library/react";
import { createCryptoAssetsHooks } from "./hooks";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Mock the legacy store
jest.mock("./legacy/legacy-store", () => ({
  legacyCryptoAssetsStore: {
    findTokenById: jest.fn(),
    findTokenByAddressInCurrency: jest.fn(),
  },
}));

// Mock the currencies module
jest.mock("./currencies", () => ({
  findCryptoCurrencyById: jest.fn(),
}));

import { legacyCryptoAssetsStore } from "./legacy/legacy-store";
import { findCryptoCurrencyById } from "./currencies";

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
const mockFindTokenById = legacyCryptoAssetsStore.findTokenById as jest.MockedFunction<
  typeof legacyCryptoAssetsStore.findTokenById
>;
const mockFindTokenByAddressInCurrency =
  legacyCryptoAssetsStore.findTokenByAddressInCurrency as jest.MockedFunction<
    typeof legacyCryptoAssetsStore.findTokenByAddressInCurrency
  >;
const mockFindCryptoCurrencyById = findCryptoCurrencyById as jest.MockedFunction<
  typeof findCryptoCurrencyById
>;

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock implementations
  mockFindTokenById.mockImplementation(async (id: string) => {
    if (id === "ethereum/erc20/usd_coin") {
      return mockToken;
    }
    return undefined;
  });

  mockFindTokenByAddressInCurrency.mockImplementation(
    async (address: string, currencyId: string) => {
      if (address === "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4" && currencyId === "ethereum") {
        return mockToken;
      }
      return undefined;
    },
  );

  mockFindCryptoCurrencyById.mockImplementation((id: string) => {
    if (id === "bitcoin") {
      return mockCryptoCurrency;
    }
    return undefined;
  });
});

describe("Hooks Factory", () => {
  it("should return legacy hooks when useCALBackend is false", () => {
    const hooks = createCryptoAssetsHooks({ useCALBackend: false });

    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(hooks.useCurrencyById).toBeDefined();
    expect(hooks.useTokenById).toBeInstanceOf(Function);
    expect(hooks.useTokenByAddressInCurrency).toBeInstanceOf(Function);
    expect(hooks.useCurrencyById).toBeInstanceOf(Function);
  });

  it("should support useCALBackend", () => {
    const hooks = createCryptoAssetsHooks({ useCALBackend: true });
    expect(hooks.useTokenById).toBeInstanceOf(Function);
    expect(hooks.useTokenByAddressInCurrency).toBeInstanceOf(Function);
    expect(hooks.useCurrencyById).toBeInstanceOf(Function);
  });

  it("should return legacy hooks when useCALBackend is not specified", () => {
    const hooks = createCryptoAssetsHooks();
    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(hooks.useCurrencyById).toBeDefined();
  });

  it("should return legacy hooks when config is empty object", () => {
    const hooks = createCryptoAssetsHooks({});
    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(hooks.useCurrencyById).toBeDefined();
  });
});

describe("Legacy hooks", () => {
  describe("useTokenById", () => {
    it("should start with loading state and then return token", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useTokenById("ethereum/erc20/usd_coin"));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with token
      expect(result.current.token).toBe(mockToken);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle empty id parameter", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useTokenById(""));

      // Should immediately settle with no token
      expect(result.current.loading).toBe(false);
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle non-existent token id", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useTokenById("non-existent-token"));

      // Initial loading state
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with no token (but no error since the store returns undefined)
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should re-run when id changes", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result, rerender } = renderHook(({ id }) => hooks.useTokenById(id), {
        initialProps: { id: "ethereum/erc20/usd_coin" },
      });

      // Wait for first token to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.token).toBe(mockToken);
      });

      // Change the id
      rerender({ id: "different-token" });

      // Should start loading again and reset token
      expect(result.current.loading).toBe(true);

      // Wait for the token to be reset
      await waitFor(() => {
        expect(result.current.token).toBeUndefined();
      });

      // Wait for new search to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have no token for the new id
      expect(result.current.token).toBeUndefined();
    });
  });

  describe("useTokenByAddressInCurrency", () => {
    it("should start with loading state and then return token", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency(
          "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4",
          "ethereum",
        ),
      );

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with token
      expect(result.current.token).toBe(mockToken);
      expect(result.current.error).toBeUndefined();
    });

    it("should handle empty address parameter", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useTokenByAddressInCurrency("", "ethereum"));

      // Should immediately settle with no token
      expect(result.current.loading).toBe(false);
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle empty currencyId parameter", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4", ""),
      );

      // Should immediately settle with no token
      expect(result.current.loading).toBe(false);
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle non-existent token address", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xNonExistentAddress", "ethereum"),
      );

      // Initial loading state
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with no token (but no error since the store returns undefined)
      expect(result.current.token).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should re-run when address or currencyId changes", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result, rerender } = renderHook(
        ({ address, currencyId }) => hooks.useTokenByAddressInCurrency(address, currencyId),
        {
          initialProps: {
            address: "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4",
            currencyId: "ethereum",
          },
        },
      );

      // Wait for first token to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.token).toBe(mockToken);
      });

      // Change the address
      rerender({
        address: "0xDifferentAddress",
        currencyId: "ethereum",
      });

      // Should start loading again and reset token
      expect(result.current.loading).toBe(true);

      // Wait for the token to be reset
      await waitFor(() => {
        expect(result.current.token).toBeUndefined();
      });

      // Wait for new search to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have no token for the new address
      expect(result.current.token).toBeUndefined();
    });
  });

  describe("useCurrencyById", () => {
    it("should return crypto currency when found", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useCurrencyById("bitcoin"));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.currency).toBeUndefined();
      expect(result.current.error).toBeUndefined();

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with crypto currency
      expect(result.current.currency).toBe(mockCryptoCurrency);
      expect(result.current.error).toBeUndefined();
    });

    it("should fallback to token when crypto currency not found", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useCurrencyById("ethereum/erc20/usd_coin"));

      // Initial loading state
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with token
      expect(result.current.currency).toBe(mockToken);
      expect(result.current.error).toBeUndefined();
      expect(mockFindCryptoCurrencyById).toHaveBeenCalledWith("ethereum/erc20/usd_coin");
      expect(mockFindTokenById).toHaveBeenCalledWith("ethereum/erc20/usd_coin");
    });

    it("should handle empty id parameter", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useCurrencyById(""));

      // Should immediately settle with no currency
      expect(result.current.loading).toBe(false);
      expect(result.current.currency).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle non-existent currency id", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result } = renderHook(() => hooks.useCurrencyById("non-existent"));

      // Initial loading state
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Settled state with no currency
      expect(result.current.currency).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should re-run when id changes", async () => {
      const hooks = createCryptoAssetsHooks({ useCALBackend: false });
      const { result, rerender } = renderHook(({ id }) => hooks.useCurrencyById(id), {
        initialProps: { id: "bitcoin" },
      });

      // Wait for first currency to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.currency).toBe(mockCryptoCurrency);
      });

      // Change the id to a token
      rerender({ id: "ethereum/erc20/usd_coin" });

      // Should start loading again
      expect(result.current.loading).toBe(true);

      // Wait for new search to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have token for the new id
      expect(result.current.currency).toBe(mockToken);
    });
  });
});

// Mock the CAL client API
jest.mock("./cal-client/state-manager/api", () => ({
  cryptoAssetsApi: {
    useFindTokenByIdQuery: jest.fn(),
    useFindTokenByAddressInCurrencyQuery: jest.fn(),
  },
}));

import { cryptoAssetsApi } from "./cal-client/state-manager/api";

const mockUseFindTokenByIdQuery = cryptoAssetsApi.useFindTokenByIdQuery as jest.MockedFunction<
  typeof cryptoAssetsApi.useFindTokenByIdQuery
>;
const mockUseFindTokenByAddressInCurrencyQuery =
  cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery as jest.MockedFunction<
    typeof cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery
  >;

describe("CAL Backend hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useTokenById", () => {
    it("should return token data from CAL backend", () => {
      mockUseFindTokenByIdQuery.mockReturnValue({
        data: mockToken,
        isLoading: false,
        error: undefined,
      } as any);

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useTokenById("ethereum/erc20/usd_coin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useTokenById("ethereum/erc20/usd_coin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useTokenById("non-existent"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useTokenById("non-existent"));

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("useTokenByAddressInCurrency", () => {
    it("should return token data from CAL backend", () => {
      mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({
        data: mockToken,
        isLoading: false,
        error: undefined,
      } as any);

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ethereum"),
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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ethereum"),
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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xNonExistent", "ethereum"),
      );

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() =>
        hooks.useTokenByAddressInCurrency("0xNonExistent", "ethereum"),
      );

      expect(result.current.token).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("useCurrencyById", () => {
    it("should return crypto currency when found", () => {
      mockFindCryptoCurrencyById.mockReturnValue(mockCryptoCurrency);

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useCurrencyById("bitcoin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useCurrencyById("ethereum/erc20/usd_coin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useCurrencyById("ethereum/erc20/usd_coin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useCurrencyById("ethereum/erc20/usd_coin"));

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

      const hooks = createCryptoAssetsHooks({ useCALBackend: true });
      const { result } = renderHook(() => hooks.useCurrencyById("non-existent"));

      expect(result.current.currency).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });
});
