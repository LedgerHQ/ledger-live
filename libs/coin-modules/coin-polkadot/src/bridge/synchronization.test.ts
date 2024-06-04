import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import { PolkadotOperation } from "../types";
import getAccountShape from "./synchronization";

const mockGetAccount = jest.fn();
const mockGetOperations = jest.fn();
jest.mock("../network", () => ({
  getAccount: () => mockGetAccount(),
  getOperations: () => mockGetOperations(),
}));

describe("getAccountShape", () => {
  beforeEach(() => {
    mockGetAccount.mockClear();
    mockGetOperations.mockClear();
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
        currency: getCryptoCurrencyById("polkadot"),
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
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
        currency: getCryptoCurrencyById("polkadot"),
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
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
        currency: getCryptoCurrencyById("polkadot"),
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(shape.operationsCount).toEqual(1);
    expect(shape.operations).toEqual(expect.arrayContaining(initialOperations));
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
        currency: getCryptoCurrencyById("polkadot"),
        address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
        initialAccount,
        derivationMode: "polkadotbip44",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(shape.operationsCount).toEqual(2);
    expect(shape.operations).toEqual(expect.arrayContaining(apiOperations));
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
