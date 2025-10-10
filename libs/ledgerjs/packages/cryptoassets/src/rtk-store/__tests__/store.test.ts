import { RtkCryptoAssetsStore, createRtkCryptoAssetsStore } from "../store";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "../../currencies";

jest.mock("../../currencies", () => ({
  getCryptoCurrencyById: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("RtkCryptoAssetsStore", () => {
  let store: RtkCryptoAssetsStore;
  let mockDispatch: jest.Mock;
  let mockApi: any;

  const mockToken: TokenCurrency = {
    type: "TokenCurrency",
    id: "test-token",
    name: "Test Token",
    ticker: "TEST",
    contractAddress: "0x123",
    parentCurrency: getCryptoCurrencyById("ethereum"),
    tokenType: "ERC20",
    units: [
      {
        code: "TEST",
        name: "Test Token",
        magnitude: 18,
      },
    ],
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockApi = {
      endpoints: {
        findTokenById: {
          initiate: jest.fn(),
        },
        findTokenByAddressInCurrency: {
          initiate: jest.fn(),
        },
      },
    };

    store = createRtkCryptoAssetsStore(mockApi, mockDispatch);
  });

  describe("findTokenById", () => {
    it("should return token when found", async () => {
      const mockResult = {
        data: mockToken,
        error: undefined,
      };
      mockDispatch.mockResolvedValue(mockResult);

      const result = await store.findTokenById("test-token");

      expect(result).toEqual(mockToken);
      expect(mockApi.endpoints.findTokenById.initiate).toHaveBeenCalledWith(
        { id: "test-token" },
        { forceRefetch: true },
      );
    });

    it("should return undefined when token not found", async () => {
      const mockResult = {
        data: undefined,
        error: undefined,
      };
      mockDispatch.mockResolvedValue(mockResult);

      const result = await store.findTokenById("non-existent");

      expect(result).toBeUndefined();
    });

    it("should throw error when API call fails", async () => {
      const mockError = new Error("API Error");
      const mockResult = {
        data: undefined,
        error: mockError,
      };
      mockDispatch.mockResolvedValue(mockResult);

      await expect(store.findTokenById("test-token")).rejects.toThrow("API Error");
    });
  });

  describe("findTokenByAddressInCurrency", () => {
    it("should return token when found", async () => {
      const mockResult = {
        data: mockToken,
        error: undefined,
      };
      mockDispatch.mockResolvedValue(mockResult);

      const result = await store.findTokenByAddressInCurrency("0x123", "ethereum");

      expect(result).toEqual(mockToken);
      expect(mockApi.endpoints.findTokenByAddressInCurrency.initiate).toHaveBeenCalledWith(
        {
          contract_address: "0x123",
          network: "ethereum",
        },
        { forceRefetch: true },
      );
    });

    it("should return undefined when token not found", async () => {
      const mockResult = {
        data: undefined,
        error: undefined,
      };
      mockDispatch.mockResolvedValue(mockResult);

      const result = await store.findTokenByAddressInCurrency("0x123", "ethereum");

      expect(result).toBeUndefined();
    });

    it("should throw error when API call fails", async () => {
      const mockError = new Error("API Error");
      const mockResult = {
        data: undefined,
        error: mockError,
      };
      mockDispatch.mockResolvedValue(mockResult);

      await expect(store.findTokenByAddressInCurrency("0x123", "ethereum")).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("getApi", () => {
    it("should return the API instance", () => {
      const api = store.getApi();
      expect(api).toBe(mockApi);
    });
  });
});

describe("createRtkCryptoAssetsStore", () => {
  it("should create store instance", () => {
    const mockDispatch = jest.fn();
    const mockApi = {
      endpoints: {
        findTokenById: {
          initiate: jest.fn(),
        },
        findTokenByAddressInCurrency: {
          initiate: jest.fn(),
        },
      },
    } as any;

    const store = createRtkCryptoAssetsStore(mockApi, mockDispatch);

    expect(store).toBeInstanceOf(RtkCryptoAssetsStore);
  });
});
