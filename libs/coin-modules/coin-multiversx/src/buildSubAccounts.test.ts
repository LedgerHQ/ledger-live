import MultiversXBuildESDTTokenAccounts from "./buildSubAccounts";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: jest.fn(() => ({
    findTokenById: jest.fn(),
  })),
}));

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  emptyHistoryCache: {},
  encodeTokenAccountId: jest.fn((parentId, token) => `${parentId}:${token.id}`),
}));

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  mergeOps: jest.fn((oldOps, newOps) => [...oldOps, ...newOps]),
}));

jest.mock("./api", () => ({
  getAccountESDTTokens: jest.fn(),
  getESDTOperations: jest.fn(),
}));

jest.mock("./logic", () => ({
  addPrefixToken: jest.fn((id) => `multiversx/esdt/${id}`),
  extractTokenId: jest.fn((id) => id.split("/").pop() || id),
}));

const { getCryptoAssetsStore } = jest.requireMock("@ledgerhq/cryptoassets/state");
const { getAccountESDTTokens, getESDTOperations } = jest.requireMock("./api");

describe("buildSubAccounts", () => {
  const createCurrency = (): CryptoCurrency =>
    ({
      id: "multiversx",
      name: "MultiversX",
      ticker: "EGLD",
      units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
    }) as CryptoCurrency;

  const createToken = (ticker: string): TokenCurrency =>
    ({
      id: `multiversx/esdt/${ticker}`,
      ticker,
      name: ticker,
      units: [{ code: ticker, magnitude: 6, name: ticker }],
    }) as unknown as TokenCurrency;

  beforeEach(() => {
    jest.clearAllMocks();
    getAccountESDTTokens.mockResolvedValue([]);
    getESDTOperations.mockResolvedValue([]);
  });

  it("returns empty array when no ESDT tokens", async () => {
    getAccountESDTTokens.mockResolvedValue([]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount: null,
      syncConfig: {},
    });

    expect(result).toEqual([]);
  });

  it("builds token accounts for ESDT tokens", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000",
      },
    ]);

    getESDTOperations.mockResolvedValue([]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount: null,
      syncConfig: {},
    });

    expect(result).toHaveLength(1);
    expect(result![0].token).toBe(mockToken);
    expect(result![0].balance.toString()).toBe("1000000");
  });

  it("skips blacklisted tokens", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000",
      },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount: null,
      syncConfig: {
        blacklistedTokenIds: [mockToken.id],
      },
    });

    expect(result).toEqual([]);
  });

  it("skips tokens not found in crypto assets store", async () => {
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(null),
    });

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "UNKNOWN-123456",
        balance: "1000000",
      },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount: null,
      syncConfig: {},
    });

    expect(result).toEqual([]);
  });

  it("syncs operations for existing token accounts", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    const existingTokenAccount = {
      id: "account1:multiversx/esdt/USDC",
      type: "TokenAccount",
      parentId: "account1",
      token: mockToken,
      balance: new BigNumber("500000"),
      spendableBalance: new BigNumber("500000"),
      operations: [
        {
          id: "op1",
          hash: "hash1",
          date: new Date("2024-01-01"),
        },
      ],
      operationsCount: 1,
      pendingOperations: [],
      swapHistory: [],
    } as unknown as TokenAccount;

    const existingAccount = {
      subAccounts: [existingTokenAccount],
    } as unknown as Account;

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000",
      },
    ]);

    getESDTOperations.mockResolvedValue([
      {
        id: "op2",
        hash: "hash2",
        date: new Date("2024-01-02"),
      },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount,
      syncConfig: {},
    });

    expect(result).toHaveLength(1);
    expect(result![0].balance.toString()).toBe("1000000");
  });

  it("preserves existing token account order", async () => {
    const mockToken1 = createToken("USDC");
    const mockToken2 = createToken("USDT");

    // Mock findTokenById to return tokens based on the hex-encoded identifier
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockImplementation((id: string) => {
        // The id will be like "multiversx/esdt/555344432d313233343536" (hex encoded)
        if (id.includes("555344432d313233343536")) return Promise.resolve(mockToken1); // USDC-123456
        if (id.includes("555344542d373839303132")) return Promise.resolve(mockToken2); // USDT-789012
        return Promise.resolve(null);
      }),
    });

    const existingAccount = {
      subAccounts: [
        {
          id: "account1:multiversx/esdt/USDT",
          type: "TokenAccount",
          token: mockToken2,
          balance: new BigNumber("100"),
          spendableBalance: new BigNumber("100"),
          operations: [],
          operationsCount: 0,
          pendingOperations: [],
          swapHistory: [],
        },
        {
          id: "account1:multiversx/esdt/USDC",
          type: "TokenAccount",
          token: mockToken1,
          balance: new BigNumber("200"),
          spendableBalance: new BigNumber("200"),
          operations: [],
          operationsCount: 0,
          pendingOperations: [],
          swapHistory: [],
        },
      ],
    } as unknown as Account;

    getAccountESDTTokens.mockResolvedValue([
      { identifier: "USDC-123456", balance: "1000000" },
      { identifier: "USDT-789012", balance: "2000000" },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount,
      syncConfig: {},
    });

    expect(result).toHaveLength(2);
    // Order should be preserved from existing account
    expect(result![0].token.ticker).toBe("USDT");
    expect(result![1].token.ticker).toBe("USDC");
  });

  it("updates token account balance when changed", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    const existingTokenAccount = {
      id: "account1:multiversx/esdt/USDC",
      type: "TokenAccount",
      parentId: "account1",
      token: mockToken,
      balance: new BigNumber("500000"),
      spendableBalance: new BigNumber("500000"),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      swapHistory: [],
    } as unknown as TokenAccount;

    const existingAccount = {
      subAccounts: [existingTokenAccount],
    } as unknown as Account;

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000", // New balance
      },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount,
      syncConfig: {},
    });

    expect(result![0].balance.toString()).toBe("1000000");
  });

  it("returns same token account when balance unchanged", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    const existingTokenAccount = {
      id: "account1:multiversx/esdt/USDC",
      type: "TokenAccount",
      parentId: "account1",
      token: mockToken,
      balance: new BigNumber("1000000"),
      spendableBalance: new BigNumber("1000000"),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      swapHistory: [],
    } as unknown as TokenAccount;

    const existingAccount = {
      subAccounts: [existingTokenAccount],
    } as unknown as Account;

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000", // Same balance
      },
    ]);

    // Return empty to indicate no change in operations
    getESDTOperations.mockResolvedValue([]);
    const { mergeOps } = jest.requireMock("@ledgerhq/coin-framework/bridge/jsHelpers");
    mergeOps.mockReturnValue(existingTokenAccount.operations);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount,
      syncConfig: {},
    });

    // Token account should be unchanged
    expect(result![0].balance.toString()).toBe("1000000");
  });

  it("handles empty blacklistedTokenIds", async () => {
    const mockToken = createToken("USDC");
    getCryptoAssetsStore.mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(mockToken),
    });

    getAccountESDTTokens.mockResolvedValue([
      {
        identifier: "USDC-123456",
        balance: "1000000",
      },
    ]);

    const result = await MultiversXBuildESDTTokenAccounts({
      currency: createCurrency(),
      accountId: "account1",
      accountAddress: "erd1test",
      existingAccount: null,
      syncConfig: {
        blacklistedTokenIds: [],
      },
    });

    expect(result).toHaveLength(1);
  });
});
