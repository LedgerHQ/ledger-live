/// <reference types="jest" />
import { RtkCryptoAssetsStore, createRtkCryptoAssetsStore } from "./store";
import { CryptoAssetsApi } from "./api";
import { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/errors";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock the API
jest.mock("./api", () => ({
  cryptoAssetsApi: {
    endpoints: {
      findTokenById: {
        initiate: jest.fn(),
      },
      findTokenByAddressInCurrency: {
        initiate: jest.fn(),
      },
      getTokensSyncHash: {
        initiate: jest.fn(),
      },
    },
  },
}));

describe("RtkCryptoAssetsStore", () => {
  let mockApi: CryptoAssetsApi;
  let mockDispatch: jest.Mock;
  let store: RtkCryptoAssetsStore;

  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockApi = {
      endpoints: {
        findTokenById: {
          initiate: jest.fn(),
        },
        findTokenByAddressInCurrency: {
          initiate: jest.fn(),
        },
        getTokensSyncHash: {
          initiate: jest.fn(),
        },
      },
    } as unknown as CryptoAssetsApi;

    mockDispatch = jest.fn();
    store = new RtkCryptoAssetsStore(mockApi, mockDispatch);
  });

  describe("remapRtkQueryError - error remapping", () => {
    describe("4xx status codes", () => {
      it("should remap 400 status to LedgerAPI4xx", async () => {
        const mockError = { status: 400, error: "Bad Request" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI4xx);
        expect(mockDispatch).toHaveBeenCalled();
      });

      it("should remap 404 status to LedgerAPI4xx", async () => {
        const mockError = { status: 404, error: "Not Found" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI4xx);
      });

      it("should remap 499 status to LedgerAPI4xx", async () => {
        const mockError = { status: 499, error: "Client Closed Request" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI4xx);
      });

      it("should remap 4xx errors in findTokenByAddressInCurrency", async () => {
        const mockError = { status: 401, error: "Unauthorized" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenByAddressInCurrency("0x123", "ethereum")).rejects.toThrow(
          LedgerAPI4xx,
        );
      });

      it("should remap 4xx errors in getTokensSyncHash", async () => {
        const mockError = { status: 403, error: "Forbidden" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.getTokensSyncHash("ethereum")).rejects.toThrow(LedgerAPI4xx);
      });
    });

    describe("5xx status codes", () => {
      it("should remap 500 status to LedgerAPI5xx", async () => {
        const mockError = { status: 500, error: "Internal Server Error" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI5xx);
      });

      it("should remap 503 status to LedgerAPI5xx", async () => {
        const mockError = { status: 503, error: "Service Unavailable" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI5xx);
      });

      it("should remap 599 status to LedgerAPI5xx", async () => {
        const mockError = { status: 599, error: "Network Timeout" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI5xx);
      });

      it("should remap 5xx errors in findTokenByAddressInCurrency", async () => {
        const mockError = { status: 502, error: "Bad Gateway" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenByAddressInCurrency("0x123", "ethereum")).rejects.toThrow(
          LedgerAPI5xx,
        );
      });

      it("should remap 5xx errors in getTokensSyncHash", async () => {
        const mockError = { status: 504, error: "Gateway Timeout" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.getTokensSyncHash("ethereum")).rejects.toThrow(LedgerAPI5xx);
      });
    });

    describe("other numeric status codes", () => {
      it("should remap status < 400 to NetworkDown", async () => {
        const mockError = { status: 200, error: "OK" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
      });

      it("should remap status 300-399 to NetworkDown", async () => {
        const mockError = { status: 301, error: "Moved Permanently" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
      });

      it("should remap status >= 600 to NetworkDown", async () => {
        const mockError = { status: 600, error: "Unknown Error" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
      });

      it("should remap status 0 to NetworkDown", async () => {
        const mockError = { status: 0, error: "Network Error" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
      });
    });

    describe("FETCH_ERROR status", () => {
      it("should remap FETCH_ERROR to NetworkDown", async () => {
        const mockError = { status: "FETCH_ERROR", error: "Failed to fetch" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
      });

      it("should remap FETCH_ERROR in findTokenByAddressInCurrency", async () => {
        const mockError = { status: "FETCH_ERROR", error: "Network failure" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenByAddressInCurrency("0x123", "ethereum")).rejects.toThrow(
          NetworkDown,
        );
      });

      it("should remap FETCH_ERROR in getTokensSyncHash", async () => {
        const mockError = { status: "FETCH_ERROR", error: "Connection failed" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.getTokensSyncHash("ethereum")).rejects.toThrow(NetworkDown);
      });
    });

    describe("other string status codes", () => {
      it("should remap other string status to generic Error with error message", async () => {
        const mockError = { status: "PARSING_ERROR", error: "Failed to parse response" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow("Failed to parse response");
        await expect(store.findTokenById("test-id")).rejects.toThrow(Error);
      });

      it("should remap CUSTOM_ERROR to generic Error", async () => {
        const mockError = { status: "CUSTOM_ERROR", error: "Custom error message" };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow("Custom error message");
      });

      it("should preserve error message in generic Error", async () => {
        const errorMessage = "Something went wrong";
        const mockError = { status: "UNKNOWN_STATUS", error: errorMessage };
        mockDispatch.mockResolvedValue({ error: mockError });

        await expect(store.findTokenById("test-id")).rejects.toThrow(errorMessage);
        await expect(store.findTokenById("test-id")).rejects.toThrow(Error);
      });
    });
  });

  describe("successful operations", () => {
    it("should return data when findTokenById succeeds", async () => {
      const mockToken: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        tokenType: "erc20",
        delisted: false,
        disableCountervalue: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
        parentCurrency: {} as any,
      };

      mockDispatch.mockResolvedValue({ data: mockToken });

      const result = await store.findTokenById("ethereum/erc20/usdc");
      expect(result).toEqual(mockToken);
    });

    it("should return data when findTokenByAddressInCurrency succeeds", async () => {
      const mockToken: TokenCurrency = {
        type: "TokenCurrency",
        id: "ethereum/erc20/usdc",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        name: "USD Coin",
        ticker: "USDC",
        units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
        tokenType: "erc20",
        delisted: false,
        disableCountervalue: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
        parentCurrency: {} as any,
      };

      mockDispatch.mockResolvedValue({ data: mockToken });

      const result = await store.findTokenByAddressInCurrency(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "ethereum",
      );
      expect(result).toEqual(mockToken);
    });

    it("should return data when getTokensSyncHash succeeds", async () => {
      const mockHash = "abc123def456";
      mockDispatch.mockResolvedValue({ data: mockHash });

      const result = await store.getTokensSyncHash("ethereum");
      expect(result).toBe(mockHash);
    });

    it("should return undefined when findTokenById returns undefined", async () => {
      mockDispatch.mockResolvedValue({ data: undefined });

      const result = await store.findTokenById("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("createRtkCryptoAssetsStore", () => {
    it("should create a new RtkCryptoAssetsStore instance", () => {
      const createdStore = createRtkCryptoAssetsStore(mockApi, mockDispatch);
      expect(createdStore).toBeInstanceOf(RtkCryptoAssetsStore);
    });

    it("should return the same API via getApi", () => {
      const createdStore = createRtkCryptoAssetsStore(mockApi, mockDispatch);
      expect(createdStore.getApi()).toBe(mockApi);
    });
  });

  describe("getApi", () => {
    it("should return the API instance", () => {
      expect(store.getApi()).toBe(mockApi);
    });
  });

  describe("error remapping edge cases", () => {
    it("should handle boundary case status 399", async () => {
      const mockError = { status: 399, error: "Client Error" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(NetworkDown);
    });

    it("should handle boundary case status 400", async () => {
      const mockError = { status: 400, error: "Bad Request" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI4xx);
    });

    it("should handle boundary case status 499", async () => {
      const mockError = { status: 499, error: "Client Closed Request" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI4xx);
    });

    it("should handle boundary case status 500", async () => {
      const mockError = { status: 500, error: "Internal Server Error" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI5xx);
    });

    it("should handle boundary case status 599", async () => {
      const mockError = { status: 599, error: "Network Timeout" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(LedgerAPI5xx);
    });

    it("should handle empty error message", async () => {
      const mockError = { status: "PARSING_ERROR", error: "" };
      mockDispatch.mockResolvedValue({ error: mockError });

      await expect(store.findTokenById("test-id")).rejects.toThrow(Error);
      await expect(store.findTokenById("test-id")).rejects.toThrow("");
    });
  });
});
