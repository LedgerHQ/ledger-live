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
  const mockGetStakes = jest.fn();
  return {
    getAccountBalances: mockGetAccountBalances,
    getOperations: mockGetOperations,
    getStakes: mockGetStakes,
    createTransaction: jest.fn(),
  };
});

describe("getAccountShape", () => {
  const mockGetAccountBalances = networkModule.getAccountBalances as jest.Mock;
  const mockGetOperations = networkModule.getOperations as jest.Mock;
  const mockGetStakes = networkModule.getStakes as jest.Mock;

  beforeEach(() => {
    mockGetAccountBalances.mockClear();
    mockGetOperations.mockClear();
    mockGetStakes.mockClear();
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
    mockGetStakes.mockResolvedValue([]);

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
    mockGetStakes.mockResolvedValue([]);

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
    mockGetStakes.mockResolvedValue([]);

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
    mockGetStakes.mockResolvedValue([]);

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
    mockGetStakes.mockResolvedValue([]);

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
});

function createAccountBalance(overrides = {}) {
  return {
    coinType: DEFAULT_COIN_TYPE,
    blockHeight: 10,
    balance: new BigNumber(faker.string.numeric()),
    ...overrides,
  };
}
