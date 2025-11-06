import { getBalance } from "./getBalance";
import { apiClient } from "../network/api";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("../network/api");

setupMockCryptoAssetsStore();

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return native balance when only HBAR is present", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const mockMirrorAccount = {
      balance: {
        balance: "1000000000",
      },
    };

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith(address);
    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt("1000000000"),
      },
    ]);
  });

  it("should return native balance and token balances", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const mockMirrorAccount = {
      balance: {
        balance: "1000000000",
      },
    };
    const mockMirrorTokens = [
      {
        token_id: "0.0.7890",
        balance: "5000",
      },
      {
        token_id: "0.0.9876",
        balance: "10000",
      },
    ];
    const mockToken1: TokenCurrency = {
      type: "TokenCurrency",
      id: "token1",
      contractAddress: "0.0.7890",
      tokenType: "hts",
      name: "Test Token 1",
      ticker: "TT1",
      parentCurrency: mockCurrency,
      units: [{ name: "TT1", code: "tt1", magnitude: 6 }],
      delisted: false,
      disableCountervalue: false,
    };
    const mockToken2: TokenCurrency = {
      type: "TokenCurrency",
      id: "token2",
      contractAddress: "0.0.9876",
      tokenType: "hts",
      name: "Test Token 2",
      ticker: "TT2",
      parentCurrency: mockCurrency,
      units: [{ name: "TT2", code: "tt2", magnitude: 8 }],
      delisted: false,
      disableCountervalue: false,
    };

    const findTokenByAddressInCurrencyMock = jest
      .fn()
      .mockImplementation(
        async (tokenId: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
          if (tokenId === "0.0.7890") return mockToken1;
          if (tokenId === "0.0.9876") return mockToken2;
          return undefined;
        },
      );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith(address);
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledTimes(2);
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledWith("0.0.7890", "hedera");
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledWith("0.0.9876", "hedera");
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          asset: { type: "native" },
          value: BigInt("1000000000"),
        },
        {
          value: BigInt("5000"),
          asset: {
            type: mockToken1.tokenType,
            assetReference: mockToken1.contractAddress,
            assetOwner: address,
            name: mockToken1.name,
            unit: mockToken1.units[0],
          },
        },
        {
          value: BigInt("10000"),
          asset: {
            type: mockToken2.tokenType,
            assetReference: mockToken2.contractAddress,
            assetOwner: address,
            name: mockToken2.name,
            unit: mockToken2.units[0],
          },
        },
      ]),
    );
  });

  it("should skip tokens not found in CAL", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const mockMirrorAccount = {
      balance: {
        balance: "1000000000",
      },
    };
    const mockMirrorTokens = [
      {
        token_id: "0.0.7890",
        balance: "5000",
      },
      {
        token_id: "0.0.9876",
        balance: "10000",
      },
    ];
    const mockToken1: TokenCurrency = {
      type: "TokenCurrency",
      id: "token1",
      contractAddress: "0.0.7890",
      tokenType: "hts",
      name: "Test Token 1",
      ticker: "TT1",
      parentCurrency: mockCurrency,
      units: [{ name: "TT1", code: "tt1", magnitude: 6 }],
      delisted: false,
      disableCountervalue: false,
    };

    const findTokenByAddressInCurrencyMock = jest
      .fn()
      .mockImplementation(
        async (tokenId: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
          if (tokenId === "0.0.7890") return mockToken1;
          return undefined;
        },
      );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);

    const result = await getBalance(mockCurrency, address);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      asset: { type: "native" },
      value: BigInt("1000000000"),
    });
    expect(result[1]).toEqual({
      value: BigInt("5000"),
      asset: {
        type: mockToken1.tokenType,
        assetReference: mockToken1.contractAddress,
        assetOwner: address,
        name: mockToken1.name,
        unit: mockToken1.units[0],
      },
    });
  });

  it("should throw when failing to getAccount data", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const error = new Error("Network error");

    (apiClient.getAccount as jest.Mock).mockRejectedValue(error);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);

    await expect(getBalance(mockCurrency, address)).rejects.toThrow(error);
  });

  it("should throw when failing to getAccountTokens data", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const error = new Error("Network error");
    const mockMirrorAccount = {
      balance: {
        balance: "1000000000",
      },
    };

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockRejectedValue(error);

    await expect(getBalance(mockCurrency, address)).rejects.toThrow(error);
  });
});
