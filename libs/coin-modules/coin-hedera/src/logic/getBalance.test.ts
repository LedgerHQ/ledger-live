import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getBalance } from "./getBalance";
import { apiClient } from "../network/api";
import { getMockedCurrency, getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";

jest.mock("../network/api");

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
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [] });

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith(address);
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
    ];
    const mockTokenHTS = getMockedHTSTokenCurrency({
      contractAddress: "0.0.7890",
    });

    const findTokenByAddressInCurrencyMock = jest
      .fn()
      .mockImplementation(
        async (tokenId: string, _currencyId: string): Promise<TokenCurrency | undefined> => {
          if (tokenId === "0.0.7890") return mockTokenHTS;
          return undefined;
        },
      );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [] });

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith(address);
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledTimes(1);
    expect(findTokenByAddressInCurrencyMock).toHaveBeenCalledWith("0.0.7890", "hedera");
    expect(result).toEqual(
      expect.arrayContaining([
        {
          asset: { type: "native" },
          value: BigInt("1000000000"),
        },
        {
          value: BigInt("5000"),
          asset: {
            type: mockTokenHTS.tokenType,
            assetReference: mockTokenHTS.contractAddress,
            assetOwner: address,
            name: mockTokenHTS.name,
            unit: mockTokenHTS.units[0],
          },
        },
      ]),
    );
  });

  it("should return stake", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const mockMirrorAccount = {
      account: address,
      staked_node_id: 5,
      balance: {
        balance: 100,
      },
      pending_reward: 100,
    };
    const mockMirrorNode = {
      node_id: 5,
      node_account_id: "0.0.5",
      description: "Hosted for Wipro | Amsterdam, Netherlands",
      max_stake: 45000000000000000,
      stake: 45000000000000000,
    };

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [mockMirrorNode] });

    const result = await getBalance(mockCurrency, address);

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith(address);
    expect(apiClient.getNodes).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      asset: { type: "native" },
      value: BigInt(mockMirrorAccount.balance.balance),
      stake: {
        uid: address,
        address,
        asset: { type: "native" },
        state: "active",
        amount: BigInt(mockMirrorAccount.balance.balance + mockMirrorAccount.pending_reward),
        amountDeposited: BigInt(mockMirrorAccount.balance.balance),
        amountRewarded: BigInt(mockMirrorAccount.pending_reward),
        delegate: mockMirrorNode.node_account_id,
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
    const mockTokenHTS: TokenCurrency = {
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
          if (tokenId === "0.0.7890") return mockTokenHTS;
          return undefined;
        },
      );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [] });

    const result = await getBalance(mockCurrency, address);

    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt("1000000000"),
      },
      {
        value: BigInt("5000"),
        asset: {
          type: mockTokenHTS.tokenType,
          assetReference: mockTokenHTS.contractAddress,
          assetOwner: address,
          name: mockTokenHTS.name,
          unit: mockTokenHTS.units[0],
        },
      },
    ]);
  });

  it("should throw when failing to getAccount data", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const error = new Error("Network error");

    (apiClient.getAccount as jest.Mock).mockRejectedValue(error);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [] });

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
    (apiClient.getNodes as jest.Mock).mockResolvedValue({ nodes: [] });

    await expect(getBalance(mockCurrency, address)).rejects.toThrow(error);
  });
});
