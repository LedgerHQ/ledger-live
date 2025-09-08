import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { getBalance } from "./getBalance";
import { hederaMirrorNode } from "../network/mirror";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";

jest.mock("../network/mirror");
jest.mock("@ledgerhq/cryptoassets/tokens");

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

    (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (hederaMirrorNode.getAccountTokens as jest.Mock).mockResolvedValue([]);

    const result = await getBalance(mockCurrency, address);

    expect(hederaMirrorNode.getAccount).toHaveBeenCalledWith(address);
    expect(hederaMirrorNode.getAccountTokens).toHaveBeenCalledWith(address);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      asset: { type: "native" },
      value: BigInt("1000000000"),
    });
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

    (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (hederaMirrorNode.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (findTokenByAddressInCurrency as jest.Mock).mockImplementation(tokenId => {
      if (tokenId === "0.0.7890") return mockToken1;
      if (tokenId === "0.0.9876") return mockToken2;
      return null;
    });

    const result = await getBalance(mockCurrency, address);

    expect(hederaMirrorNode.getAccount).toHaveBeenCalledWith(address);
    expect(hederaMirrorNode.getAccountTokens).toHaveBeenCalledWith(address);
    expect(findTokenByAddressInCurrency).toHaveBeenCalledTimes(2);
    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.7890", "hedera");
    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.9876", "hedera");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      asset: { type: "native" },
      value: BigInt("1000000000"),
    });
    expect(result[1]).toEqual({
      value: BigInt("5000"),
      asset: {
        type: "hts",
        assetReference: "0.0.7890",
        assetOwner: address,
        name: "Test Token 1",
        unit: { name: "TT1", code: "tt1", magnitude: 6 },
      },
    });
    expect(result[2]).toEqual({
      value: BigInt("10000"),
      asset: {
        type: "hts",
        assetReference: "0.0.9876",
        assetOwner: address,
        name: "Test Token 2",
        unit: { name: "TT2", code: "tt2", magnitude: 8 },
      },
    });
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

    (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (hederaMirrorNode.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (findTokenByAddressInCurrency as jest.Mock).mockImplementation(tokenId => {
      if (tokenId === "0.0.7890") return mockToken1;
      return null;
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
        type: "hts",
        assetReference: "0.0.7890",
        assetOwner: address,
        name: "Test Token 1",
        unit: { name: "TT1", code: "tt1", magnitude: 6 },
      },
    });
  });

  it("should handle errors from hederaMirrorNode.getAccount", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const error = new Error("Network error");

    (hederaMirrorNode.getAccount as jest.Mock).mockRejectedValue(error);
    (hederaMirrorNode.getAccountTokens as jest.Mock).mockResolvedValue([]);

    await expect(getBalance(mockCurrency, address)).rejects.toThrow(error);
  });

  it("should handle errors from hederaMirrorNode.getAccountTokens", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const error = new Error("Network error");
    const mockMirrorAccount = {
      balance: {
        balance: "1000000000",
      },
    };

    (hederaMirrorNode.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (hederaMirrorNode.getAccountTokens as jest.Mock).mockRejectedValue(error);

    await expect(getBalance(mockCurrency, address)).rejects.toThrow(error);
  });
});
