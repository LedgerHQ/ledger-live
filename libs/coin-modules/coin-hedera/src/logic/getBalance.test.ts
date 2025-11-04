import { getBalance } from "./getBalance";
import { apiClient } from "../network/api";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import * as cryptoAssets from "@ledgerhq/coin-framework/crypto-assets/index";

jest.mock("../network/api");
jest.mock("@ledgerhq/coin-framework/crypto-assets/index");

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
    const mockToken1 = {
      id: "token1",
      contractAddress: "0.0.7890",
      tokenType: "hts",
      name: "Test Token 1",
      units: [{ name: "TT1", code: "tt1", magnitude: 6 }],
    };
    const mockToken2 = {
      id: "token2",
      contractAddress: "0.0.9876",
      tokenType: "hts",
      name: "Test Token 2",
      units: [{ name: "TT2", code: "tt2", magnitude: 8 }],
    };

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockImplementation(tokenId => {
        if (tokenId === "0.0.7890") return mockToken1;
        if (tokenId === "0.0.9876") return mockToken2;
        return null;
      }),
    });

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith(address);
    const store = (cryptoAssets.getCryptoAssetsStore as jest.Mock)();
    expect(store.findTokenByAddressInCurrency).toHaveBeenCalledTimes(2);
    expect(store.findTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.7890", "hedera");
    expect(store.findTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.9876", "hedera");
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
    const mockToken1 = {
      id: "token1",
      contractAddress: "0.0.7890",
      tokenType: "hts",
      name: "Test Token 1",
      units: [{ name: "TT1", code: "tt1", magnitude: 6 }],
    };

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockImplementation(tokenId => {
        if (tokenId === "0.0.7890") return mockToken1;
        return null;
      }),
    });

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
