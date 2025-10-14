import { renderHook, waitFor } from "@testing-library/react";
import { createCryptoAssetsHooks } from "./hooks";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock the legacy store
jest.mock("./legacy/legacy-store", () => ({
  legacyCryptoAssetsStore: {
    findTokenById: jest.fn(),
    findTokenByAddressInCurrency: jest.fn(),
  },
}));

import { legacyCryptoAssetsStore } from "./legacy/legacy-store";

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

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock implementations
  mockFindTokenById.mockImplementation((id: string) => {
    if (id === "ethereum/erc20/usd_coin") {
      return mockToken;
    }
    return undefined;
  });

  mockFindTokenByAddressInCurrency.mockImplementation((address: string, currencyId: string) => {
    if (address === "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4" && currencyId === "ethereum") {
      return mockToken;
    }
    return undefined;
  });
});

describe("Hooks Factory", () => {
  it("should return legacy hooks when useCALBackend is false", () => {
    const hooks = createCryptoAssetsHooks({ useCALBackend: false });

    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(hooks.useTokenById).toBeInstanceOf(Function);
    expect(hooks.useTokenByAddressInCurrency).toBeInstanceOf(Function);
  });

  it("should throw an error when useCALBackend is true", () => {
    // @ts-expect-error useCALBackend is not supported yet
    expect(() => createCryptoAssetsHooks({ useCALBackend: true })).toThrow();
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
});
