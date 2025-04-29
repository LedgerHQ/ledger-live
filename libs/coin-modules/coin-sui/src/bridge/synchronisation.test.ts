import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";

import { getAccountShape } from "./synchronisation";

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

  it("calls getAccount and getOperations", async () => {
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
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
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
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(shape).toEqual({
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      balance: accountInfo.balance,
      spendableBalance: accountInfo.balance,
      blockHeight: accountInfo.blockHeight,
      operations: [],
      operationsCount: 0,
      suiResources: {},
    });
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
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
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
    const apiOperations = [
      createFixtureOperation({ id: faker.string.uuid() }),
      createFixtureOperation({ id: faker.string.uuid() }),
    ];
    mockGetOperations.mockResolvedValue(apiOperations);

    // WHEN
    const shape = await getAccountShape(
      {
        index: -1, // not used but mandatory
        derivationPath: "not used",
        currency: getCryptoCurrencyById("sui"),
        address: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        initialAccount,
        derivationMode: "sui",
      },
      { paginationConfig: {} },
    );

    // THEN
    expect(shape.operationsCount).toEqual(initialAccount.operations.length + apiOperations.length);
    expect(shape.operations).toEqual(expect.arrayContaining(apiOperations));
  });
});

function createAccountInfo() {
  return {
    blockHeight: 10,
    balance: new BigNumber(faker.string.numeric()),
    spendableBalance: new BigNumber(faker.string.numeric()),
  };
}
