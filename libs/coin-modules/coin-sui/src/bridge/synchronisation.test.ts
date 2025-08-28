import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { getAccountShape } from "./synchronisation";
import coinConfig from "../config";
import { getFullnodeUrl } from "@mysten/sui/client";
import * as networkModule from "../network";

// Mock getTokenById and listTokensForCryptoCurrency
jest.mock("@ledgerhq/cryptoassets/tokens", () => ({
  getTokenById: (coinType: string) => ({
    id: coinType,
    ticker: "TEST",
    name: "Test Token",
    countervalueTicker: "TEST",
    standard: "SUI-20",
    tokenType: "sui",
    parentCurrency: { id: "sui" },
    contract: "0x123",
  }),
  listTokensForCryptoCurrency: () => [{ id: "0x123::sui::TEST" }],
}));

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

describe("getAccountShape", () => {
  const mockGetAccountBalances = networkModule.getAccountBalances as jest.Mock;
  const mockGetOperations = networkModule.getOperations as jest.Mock;
  const mockGetStakesRaw = networkModule.getStakesRaw as jest.Mock;

  beforeEach(() => {
    mockGetAccountBalances.mockClear();
    mockGetOperations.mockClear();
    mockGetStakesRaw.mockClear();
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
    expect(shape.subAccounts).toBeDefined();
    expect(Array.isArray(shape.subAccounts)).toBe(true);
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
      expect(shape.suiResources).toBeDefined();
      expect(shape.suiResources?.stakes).toEqual([]);
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
      expect(shape.suiResources).toBeDefined();
      expect(shape.suiResources?.stakes).toEqual(mockStakes);
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
      expect(shape.suiResources).toBeDefined();
      expect(shape.suiResources?.stakes).toBeNull();
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
