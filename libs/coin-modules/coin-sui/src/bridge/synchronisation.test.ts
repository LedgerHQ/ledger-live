/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { faker } from "@faker-js/faker";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getFullnodeUrl } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import * as networkModule from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import { getAccountShape } from "./synchronisation";

jest.mock("../network", () => {
  const mockGetAccountBalances = jest.fn();
  const mockGetOperations = jest.fn();
  const mockGetStakesRaw = jest.fn();
  return {
    getAccountBalances: mockGetAccountBalances,
    getOperations: mockGetOperations,
    getStakesRaw: mockGetStakesRaw,
    createTransaction: jest.fn(),
  };
});

const mockedFindTokenByAddressInCurrency = jest.fn();
setCryptoAssetsStore({
  findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
    mockedFindTokenByAddressInCurrency(address, currencyId),
  findTokenById: async () => undefined,
  getTokensSyncHash: async () => "0",
} as unknown as CryptoAssetsStore);

describe("getAccountShape", () => {
  const mockGetAccountBalances = networkModule.getAccountBalances as jest.Mock;
  const mockGetOperations = networkModule.getOperations as jest.Mock;
  const mockGetStakesRaw = networkModule.getStakesRaw as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      node: { url: getFullnodeUrl("mainnet") },
    }));
  });

  it("calls getAccountBalances and getOperations", async () => {
    // GIVEN
    const initialAccount = undefined;
    mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
    mockGetOperations.mockResolvedValue([]);
    mockGetStakesRaw.mockResolvedValue([]);

    // WHEN
    await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccountBalances).toHaveBeenCalledTimes(1);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("returns an AccountShapeInfo based on getAccountBalances API", async () => {
    // GIVEN
    const initialAccount = undefined;
    const accountBalance = createAccountBalance();
    mockGetAccountBalances.mockResolvedValue([accountBalance]);
    mockGetOperations.mockResolvedValue([]);
    mockGetStakesRaw.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    // THEN
    expect(shape).toEqual({
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      balance: accountBalance.balance,
      spendableBalance: accountBalance.balance,
      blockHeight: 5,
      operations: [],
      operationsCount: 0,
      suiResources: {
        stakes: [],
      },
      subAccounts: [],
      syncHash: undefined,
    });
  });

  it("returns an AccountShapeInfo with operations from initialAccount", async () => {
    // GIVEN
    const extra = { coinType: DEFAULT_COIN_TYPE };
    const initialOperations = [createFixtureOperation({ id: faker.string.uuid(), extra })];
    const initialAccount = createFixtureAccount({ operations: initialOperations });
    const accountBalance = createAccountBalance();
    mockGetAccountBalances.mockResolvedValue([accountBalance]);
    mockGetOperations.mockResolvedValue([]);
    mockGetStakesRaw.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    // THEN
    expect(shape.operationsCount).toEqual(1);
    expect(shape.operations).toEqual(expect.arrayContaining(initialOperations));
  });

  it("returns an AccountShapeInfo with operations from getOperations API", async () => {
    // GIVEN
    const initialAccount = createFixtureAccount();
    const accountBalance = createAccountBalance();
    mockGetAccountBalances.mockResolvedValue([accountBalance]);
    const extra = { coinType: DEFAULT_COIN_TYPE };
    const apiOperations = [
      createFixtureOperation({ id: faker.string.uuid(), extra }),
      createFixtureOperation({ id: faker.string.uuid(), extra }),
    ];
    mockGetOperations.mockResolvedValue(apiOperations);
    mockGetStakesRaw.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    // THEN
    expect(shape.operationsCount).toEqual(initialAccount.operations.length + apiOperations.length);
    expect(shape.operations).toEqual(expect.arrayContaining(apiOperations));
  });

  it("handles multiple token balances and creates subAccounts", async () => {
    // GIVEN
    const initialAccount = createFixtureAccount();
    const mainBalance = createAccountBalance({ coinType: DEFAULT_COIN_TYPE });
    const tokenBalance = createAccountBalance({ coinType: "0x123::sui::TEST" });
    mockGetAccountBalances.mockResolvedValue([mainBalance, tokenBalance]);
    mockGetOperations.mockResolvedValue([]);
    mockGetStakesRaw.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    // THEN
    expect(shape.balance).toEqual(mainBalance.balance);
    expect(shape.subAccounts).toBeInstanceOf(Array);
  });

  it("should build subAccounts from SUI tokens", async () => {
    mockedFindTokenByAddressInCurrency.mockImplementation((address: string, currencyId: string) => {
      if (currencyId !== "sui") {
        return undefined;
      }

      if (address === DEFAULT_COIN_TYPE) {
        return undefined;
      }

      return {
        contractAddress: "0x123",
        countervalueTicker: "TEST",
        id: `sui/coin/${address}`,
        name: "Test Token",
        parentCurrency: { id: "sui" },
        standard: "SUI-20",
        ticker: "TEST",
        tokenType: "sui",
      } as unknown as TokenCurrency;
    });

    const accountBalanceCoinType = "random coin type 1";
    const accountBalanceCoinType2 = "random coin type 2";
    mockGetAccountBalances.mockResolvedValue([
      createAccountBalance(),
      createAccountBalance({ coinType: accountBalanceCoinType }),
      createAccountBalance({ coinType: accountBalanceCoinType2 }),
    ]);
    mockGetOperations.mockResolvedValue([]);

    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const suiAccount = await getAccountShape(
      {
        index: 0,
        derivationPath: "44'/784'/0'/0'/0'",
        currency: getCryptoCurrencyById("sui"),
        address,
        initialAccount: undefined,
        derivationMode: "sui",
      },
      { blacklistedTokenIds: [], paginationConfig: {} },
    );

    expect(suiAccount.subAccounts).toEqual([
      {
        balance: expect.any(BigNumber),
        balanceHistoryCache: {
          DAY: { balances: [], latestDate: null },
          HOUR: { balances: [], latestDate: null },
          WEEK: { balances: [], latestDate: null },
        },
        blockHeight: 5,
        creationDate: expect.any(Date),
        id: `js:2:sui:${address}:sui+sui%2Fcoin%2Frandom%20coin%20type%201`,
        operations: [],
        operationsCount: 0,
        parentId: `js:2:sui:${address}:sui`,
        pendingOperations: [],
        spendableBalance: expect.any(BigNumber),
        swapHistory: [],
        token: {
          contractAddress: "0x123",
          countervalueTicker: "TEST",
          id: `sui/coin/${accountBalanceCoinType}`,
          name: "Test Token",
          parentCurrency: { id: "sui" },
          standard: "SUI-20",
          ticker: "TEST",
          tokenType: "sui",
        },
        type: "TokenAccount",
      },
      {
        balance: expect.any(BigNumber),
        balanceHistoryCache: {
          DAY: { balances: [], latestDate: null },
          HOUR: { balances: [], latestDate: null },
          WEEK: { balances: [], latestDate: null },
        },
        blockHeight: 5,
        creationDate: expect.any(Date),
        id: `js:2:sui:${address}:sui+sui%2Fcoin%2Frandom%20coin%20type%202`,
        operations: [],
        operationsCount: 0,
        parentId: `js:2:sui:${address}:sui`,
        pendingOperations: [],
        spendableBalance: expect.any(BigNumber),
        swapHistory: [],
        token: {
          contractAddress: "0x123",
          countervalueTicker: "TEST",
          id: `sui/coin/${accountBalanceCoinType2}`,
          name: "Test Token",
          parentCurrency: { id: "sui" },
          standard: "SUI-20",
          ticker: "TEST",
          tokenType: "sui",
        },
        type: "TokenAccount",
      },
    ]);
  });

  describe("stakes functionality", () => {
    it("calls getStakesRaw with the correct address", async () => {
      // GIVEN
      const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
      const initialAccount = undefined;
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue([]);

      // WHEN
      await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address,
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(mockGetStakesRaw).toHaveBeenCalledTimes(1);
      expect(mockGetStakesRaw).toHaveBeenCalledWith(address);
    });

    it("includes empty stakes in suiResources when no stakes are returned", async () => {
      // GIVEN
      const initialAccount = undefined;
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue([]);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources).toEqual({
        stakes: [],
      });
    });

    it("includes stakes in suiResources when stakes are returned", async () => {
      // GIVEN
      const initialAccount = undefined;
      const mockStakes = [
        {
          validatorAddress: "0xvalidator1",
          stakes: [
            {
              stakedSuiId: "0xstake1",
              status: "Active" as const,
              principal: "1000000000",
              stakeActiveEpoch: "100",
              stakeRequestEpoch: "95",
            },
          ],
        },
        {
          validatorAddress: "0xvalidator2",
          stakes: [
            {
              stakedSuiId: "0xstake2",
              status: "Pending" as const,
              principal: "2000000000",
              stakeActiveEpoch: "0",
              stakeRequestEpoch: "100",
            },
          ],
        },
      ];
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(mockStakes);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources).toEqual({
        stakes: mockStakes,
      });
    });

    it("handles multiple stakes per validator", async () => {
      // GIVEN
      const initialAccount = undefined;
      const mockStakes = [
        {
          validatorAddress: "0xvalidator1",
          stakes: [
            {
              stakedSuiId: "0xstake1",
              status: "Active" as const,
              principal: "1000000000",
              stakeActiveEpoch: "100",
              stakeRequestEpoch: "95",
            },
            {
              stakedSuiId: "0xstake2",
              status: "Active" as const,
              principal: "1500000000",
              stakeActiveEpoch: "100",
              stakeRequestEpoch: "95",
            },
          ],
        },
      ];
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(mockStakes);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources?.stakes).toEqual(mockStakes);
      expect(shape.suiResources?.stakes?.[0].stakes).toHaveLength(2);
    });

    it("handles different stake statuses correctly", async () => {
      // GIVEN
      const initialAccount = undefined;
      const mockStakes = [
        {
          validatorAddress: "0xvalidator1",
          stakes: [
            {
              stakedSuiId: "0xactive",
              status: "Active" as const,
              principal: "1000000000",
              stakeActiveEpoch: "100",
              stakeRequestEpoch: "95",
            },
            {
              stakedSuiId: "0xpending",
              status: "Pending" as const,
              principal: "2000000000",
              stakeActiveEpoch: "0",
              stakeRequestEpoch: "100",
            },
            {
              stakedSuiId: "0xunstaked",
              status: "Unstaked" as const,
              principal: "3000000000",
              stakeActiveEpoch: "0",
              stakeRequestEpoch: "0",
            },
          ],
        },
      ];
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(mockStakes);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources?.stakes).toEqual(mockStakes);
      const stakes = shape.suiResources?.stakes?.[0].stakes || [];
      expect(stakes).toHaveLength(3);
      expect(stakes.find(s => s.stakedSuiId === "0xactive")?.status).toBe("Active");
      expect(stakes.find(s => s.stakedSuiId === "0xpending")?.status).toBe("Pending");
      expect(stakes.find(s => s.stakedSuiId === "0xunstaked")?.status).toBe("Unstaked");
    });

    it("handles getStakesRaw throwing an error gracefully", async () => {
      // GIVEN
      const initialAccount = undefined;
      const error = new Error("Network error");
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockRejectedValue(error);

      // WHEN & THEN
      await expect(
        getAccountShape(
          {
            index: 0,
            derivationPath: "44'/784'/0'/0'/0'",
            currency: getCryptoCurrencyById("sui"),
            address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
            initialAccount,
            derivationMode: "sui",
          },
          { blacklistedTokenIds: [], paginationConfig: {} },
        ),
      ).rejects.toThrow("Network error");
    });

    it("preserves existing suiResources when initialAccount has stakes", async () => {
      // GIVEN
      const existingStakes = [
        {
          validatorAddress: "0xexistingValidator",
          stakes: [
            {
              stakedSuiId: "0xexistingStake",
              status: "Active" as const,
              principal: "500000000",
              stakeActiveEpoch: "90",
              stakeRequestEpoch: "85",
            },
          ],
        },
      ];
      const initialAccount = createFixtureAccount({
        suiResources: { stakes: existingStakes },
      });
      const newStakes = [
        {
          validatorAddress: "0xnewValidator",
          stakes: [
            {
              stakedSuiId: "0xnewStake",
              status: "Active" as const,
              principal: "1000000000",
              stakeActiveEpoch: "100",
              stakeRequestEpoch: "95",
            },
          ],
        },
      ];
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(newStakes);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources?.stakes).toEqual(newStakes);
      // The new stakes should replace the old ones, not merge
      expect(shape.suiResources?.stakes).not.toEqual(existingStakes);
    });

    it("handles large stake amounts correctly", async () => {
      // GIVEN
      const initialAccount = undefined;
      const mockStakes = [
        {
          validatorAddress: "0xvalidator1",
          stakes: [
            {
              stakedSuiId: "0xlargeStake",
              status: "Active" as const,
              principal: "999999999999999999999999999999",
              stakeActiveEpoch: "1000",
              stakeRequestEpoch: "995",
            },
          ],
        },
      ];
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(mockStakes);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources?.stakes).toEqual(mockStakes);
      const stake = shape.suiResources?.stakes?.[0].stakes?.[0];
      expect(stake?.principal).toBe("999999999999999999999999999999");
      expect(stake?.stakeActiveEpoch).toBe("1000");
      expect(stake?.stakeRequestEpoch).toBe("995");
    });

    it("handles getStakesRaw returning null or undefined", async () => {
      // GIVEN
      const initialAccount = undefined;
      mockGetAccountBalances.mockResolvedValue([createAccountBalance()]);
      mockGetOperations.mockResolvedValue([]);
      mockGetStakesRaw.mockResolvedValue(null);

      // WHEN
      const shape = await getAccountShape(
        {
          index: 0,
          derivationPath: "44'/784'/0'/0'/0'",
          currency: getCryptoCurrencyById("sui"),
          address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          initialAccount,
          derivationMode: "sui",
        },
        { blacklistedTokenIds: [], paginationConfig: {} },
      );

      // THEN
      expect(shape.suiResources).toEqual({ stakes: null });
    });
  });
});

function createAccountBalance(overrides = {}) {
  return {
    coinType: DEFAULT_COIN_TYPE,
    blockHeight: 10,
    balance: new BigNumber(faker.string.numeric()),
    ...overrides,
  };
}
