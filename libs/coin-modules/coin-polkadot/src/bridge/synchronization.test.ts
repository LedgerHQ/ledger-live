import { faker } from "@faker-js/faker";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { PolkadotOperation } from "../types";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import getAccountShape from "./synchronization";

jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));

const mockGetAccount = jest.fn();
const mockGetOperations = jest.fn();
jest.mock("../network", () => ({
  getAccount: (address: string, currency?: CryptoCurrency) => mockGetAccount(address, currency),
  getOperations: (
    accountId: string,
    addr: string,
    currency?: CryptoCurrency,
    startAt = 0,
    limit = 200,
  ) => mockGetOperations(accountId, addr, currency, startAt, limit),
}));

const CURRENCY = getCryptoCurrencyById("polkadot");
const EXPECTED_CURRENCY = getCryptoCurrencyById("assethub_polkadot");

const mockGetCoinConfig = coinConfig.getCoinConfig as jest.MockedFunction<
  typeof coinConfig.getCoinConfig
>;

describe("getAccountShape", () => {
  beforeEach(() => {
    mockGetAccount.mockClear();
    mockGetOperations.mockClear();
    mockGetCoinConfig.mockClear();

    mockGetCoinConfig.mockImplementation((currency?: CryptoCurrency): any => {
      if (currency?.id === "assethub_polkadot") {
        return {
          hasBeenMigrated: true,
        };
      }
    });
  });

  it("calls 2 apis", async () => {
    // GIVEN
    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    // WHEN
    await getAccountShape(
      {
        index: -1, // not used but mandatory
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(EXPECTED_CURRENCY);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(EXPECTED_CURRENCY);
  });

  it("returns an AccountShapeInfo based on getAccount API", async () => {
    // GIVEN
    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: -1, // not used but mandatory
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(EXPECTED_CURRENCY);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(EXPECTED_CURRENCY);

    expect(shape).toEqual(
      expect.objectContaining({
        balance: accountInfo.balance,
        spendableBalance: accountInfo.spendableBalance,
        blockHeight: accountInfo.blockHeight,
        polkadotResources: {
          nonce: accountInfo.nonce,
          controller: accountInfo.controller,
          stash: accountInfo.stash,
          lockedBalance: accountInfo.lockedBalance,
          unlockedBalance: accountInfo.unlockedBalance,
          unlockingBalance: accountInfo.unlockingBalance,
          unlockings: accountInfo.unlockings,
          nominations: accountInfo.nominations,
          numSlashingSpans: accountInfo.numSlashingSpans,
        },
      }),
    );
  });

  it("returns an AccountShapeInfo with operations from initialAccount", async () => {
    // GIVEN
    const initialOperations = [createFixtureOperation({ id: faker.string.uuid() })];
    const initialAccount = createFixtureAccount({ operations: initialOperations });
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    // WHEN
    const shape = await getAccountShape(
      {
        index: -1, // not used but mandatory
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(EXPECTED_CURRENCY);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(EXPECTED_CURRENCY);

    expect(shape.operationsCount).toEqual(0);
    expect(shape.operations).toEqual([]);
  });

  it("returns an AccountShapeInfo with operations from getOperations API", async () => {
    // GIVEN
    const initialAccount = createFixtureAccount();
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    const apiOperations: PolkadotOperation[] = [
      createFixtureOperation({ id: faker.string.uuid() }),
      createFixtureOperation({ id: faker.string.uuid() }),
    ];
    mockGetOperations.mockResolvedValue(apiOperations);

    // WHEN
    const shape = await getAccountShape(
      {
        index: -1, // not used but mandatory
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(EXPECTED_CURRENCY);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(EXPECTED_CURRENCY);

    expect(shape.operationsCount).toEqual(0);
    expect(shape.operations).toEqual([]);
  });

  it("does not migrate when assethub has not been migrated", async () => {
    mockGetCoinConfig.mockImplementation((currency?: CryptoCurrency): any => {
      if (currency?.id === "assethub_polkadot") {
        return {
          hasBeenMigrated: false,
        };
      }
    });

    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(CURRENCY);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(CURRENCY);
  });

  it("does not migrate when currency is not polkadot", async () => {
    const nonPolkadotCurrency = getCryptoCurrencyById("westend");
    mockGetCoinConfig.mockImplementation((currency?: CryptoCurrency): any => {
      if (currency?.id === "assethub_polkadot") {
        return {
          hasBeenMigrated: true,
        };
      }
    });

    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: nonPolkadotCurrency,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount.mock.lastCall[1]).toEqual(nonPolkadotCurrency);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(nonPolkadotCurrency);
  });

  it("generates correct account ID with migration", async () => {
    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    const shape = await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(shape.id).toEqual(
      "js:2:assethub_polkadot:5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J:polkadotbip44",
    );
  });

  it("generates correct account ID without migration", async () => {
    mockGetCoinConfig.mockImplementation((currency?: CryptoCurrency): any => {
      if (currency?.id === "assethub_polkadot") {
        return {
          hasBeenMigrated: false,
        };
      }
    });

    const initialAccount = undefined;
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    const shape = await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(shape.id).toEqual(
      "js:2:polkadot:5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J:polkadotbip44",
    );
  });

  it("returns correct currency in account shape", async () => {
    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    const shape = await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount: undefined,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(shape.currency).toEqual(EXPECTED_CURRENCY);
  });

  it("returns correct currency in account shape without migration", async () => {
    mockGetCoinConfig.mockImplementation((currency?: CryptoCurrency): any => {
      if (currency?.id === "assethub_polkadot") {
        return {
          hasBeenMigrated: false,
        };
      }
    });

    const accountInfo = createAccountInfo();
    mockGetAccount.mockResolvedValue(accountInfo);
    mockGetOperations.mockResolvedValue([]);

    const shape = await getAccountShape(
      {
        index: -1,
        derivationPath: "not used",
        currency: CURRENCY,
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount: undefined,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    expect(shape.currency).toEqual(CURRENCY);
  });
});

function createAccountInfo() {
  return {
    blockHeight: 54,
    balance: new BigNumber(faker.string.numeric()),
    spendableBalance: new BigNumber(faker.string.numeric()),
    nonce: 12,
    lockedBalance: new BigNumber(faker.string.numeric()),
    controller: null,
    stash: null,
    unlockedBalance: new BigNumber(faker.string.numeric()),
    unlockingBalance: new BigNumber(faker.string.numeric()),
    unlockings: [],
    nominations: [],
    numSlashingSpans: undefined,
  };
}
