import { LedgerAPI4xx } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import hederaCoinConfig from "../config";
import { HederaAddAccountError } from "../errors";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import type { HederaERC20TokenBalance } from "../types";
import { getBalance } from "./getBalance";

jest.mock("../config");
jest.mock("../network/api");
jest.mock("../network/utils");

const mockHederaConfig = jest.mocked(hederaCoinConfig);

describe("getBalance", () => {
  const address = "0.0.12345";
  const mockCurrency = getMockedCurrency();
  const mockConfig = { ...getMockedConfig() };
  const mockMirrorAccount = {
    balance: {
      balance: "1000000000",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHederaConfig.getCoinConfig.mockReturnValue(mockConfig);
  });

  it("should return native balance when only HBAR is present", async () => {
    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);

    const result = await getBalance({ currencyId: mockCurrency.id, address });

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith({ configOrCurrencyId: mockConfig, address });
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      address,
    });
    // non-staking account: no node lookup should happen
    expect(apiClient.getNode).not.toHaveBeenCalled();
    expect(apiClient.getNodes).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt("1000000000"),
      },
    ]);
  });

  it("should return native balance and raw token balances", async () => {
    const mockMirrorTokens = [
      {
        token_id: "0.0.7890",
        balance: "5000",
      },
    ];
    const mockERC20Balances: HederaERC20TokenBalance[] = [
      {
        contractAddress: "0x12345",
        balance: new BigNumber(100),
      },
    ];

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue(mockERC20Balances);

    const result = await getBalance({ currencyId: mockCurrency.id, address });

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith({ configOrCurrencyId: mockConfig, address });
    expect(apiClient.getAccountTokens).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTokens).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      address,
    });
    expect(networkUtils.getERC20BalancesForAccountV2).toHaveBeenCalledTimes(1);
    expect(networkUtils.getERC20BalancesForAccountV2).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      address,
    });
    expect(result).toEqual(
      expect.arrayContaining([
        {
          asset: { type: "native" },
          value: BigInt("1000000000"),
        },
        {
          value: BigInt("5000"),
          asset: {
            type: "hts",
            assetReference: "0.0.7890",
            assetOwner: address,
          },
        },
        {
          value: BigInt("100"),
          asset: {
            type: "erc20",
            assetReference: "0x12345",
            assetOwner: address,
          },
        },
      ]),
    );
  });

  it("should return stake", async () => {
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
    (apiClient.getNode as jest.Mock).mockResolvedValue(mockMirrorNode);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);

    const result = await getBalance({ currencyId: mockCurrency.id, address });

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith({ configOrCurrencyId: mockConfig, address });
    expect(apiClient.getNode).toHaveBeenCalledTimes(1);
    expect(apiClient.getNode).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      nodeId: mockMirrorAccount.staked_node_id,
    });
    expect(apiClient.getNodes).not.toHaveBeenCalled();
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

  it("should return all token balances without CAL filtering", async () => {
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
    const mockERC20Balances: HederaERC20TokenBalance[] = [
      {
        contractAddress: "0x12345",
        balance: new BigNumber(100),
      },
      {
        contractAddress: "0x54321",
        balance: new BigNumber(200),
      },
    ];

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue(mockMirrorTokens);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue(mockERC20Balances);

    const result = await getBalance({ currencyId: mockCurrency.id, address });

    expect(result).toEqual(
      expect.arrayContaining([
        { asset: { type: "native" }, value: BigInt("1000000000") },
        expect.objectContaining({
          asset: { type: "hts", assetReference: "0.0.7890", assetOwner: address },
        }),
        expect.objectContaining({
          asset: { type: "hts", assetReference: "0.0.9876", assetOwner: address },
        }),
        expect.objectContaining({
          asset: { type: "erc20", assetReference: "0x12345", assetOwner: address },
        }),
        expect.objectContaining({
          asset: { type: "erc20", assetReference: "0x54321", assetOwner: address },
        }),
      ]),
    );
  });

  it("should throw when failing to getAccount data", async () => {
    const error = new Error("Network error");

    (apiClient.getAccount as jest.Mock).mockRejectedValue(error);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);

    await expect(getBalance({ currencyId: mockCurrency.id, address })).rejects.toThrow(error);
  });

  it("should throw when failing to getAccountTokens data", async () => {
    const error = new Error("Network error");

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockRejectedValue(error);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);

    await expect(getBalance({ currencyId: mockCurrency.id, address })).rejects.toThrow(error);
  });

  it("should throw when failing to fetch ERC20 balances", async () => {
    const error = new Error("Network error");

    (apiClient.getAccount as jest.Mock).mockResolvedValue(mockMirrorAccount);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockRejectedValue(error);

    await expect(getBalance({ currencyId: mockCurrency.id, address })).rejects.toThrow(error);
  });

  it.each([
    {
      name: "HederaAddAccountError",
      error: new HederaAddAccountError(),
    },
    {
      name: "404 error",
      error: new LedgerAPI4xx("", { status: 404, url: undefined, method: "GET" }),
    },
  ])("should return empty results on $name", async ({ error }) => {
    const address = "0.0.0";

    (apiClient.getAccount as jest.Mock).mockRejectedValue(error);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);

    const result = await getBalance({ currencyId: mockCurrency.id, address });

    expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccount).toHaveBeenCalledWith({ configOrCurrencyId: mockConfig, address });
    expect(result).toEqual([]);
  });
});
