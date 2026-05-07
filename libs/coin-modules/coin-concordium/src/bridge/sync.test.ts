import BigNumber from "bignumber.js";
import {
  createFixtureCurrency,
  createFixtureOperation,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
  PUBLIC_KEY,
} from "../test/fixtures";
import { createTestConcordiumAccount } from "../test/testHelpers";
import { getAccountShape as getAccountShapeOriginal, getBalance, syncOperations } from "./sync";
const getAccountShape = getAccountShapeOriginal as any;

jest.mock("../network/proxyClient", () => ({
  getAccountsByPublicKey: jest.fn(),
  getAccountBalance: jest.fn(),
  getConsensusInfo: jest.fn(),
}));

jest.mock("../logic/history/listOperations", () => ({
  listOperations: jest.fn(),
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn().mockReturnValue({ minReserve: "100000" }),
  },
}));

const { getAccountsByPublicKey, getAccountBalance, getConsensusInfo } =
  jest.requireMock("../network/proxyClient");

const { listOperations } = jest.requireMock("../logic/history/listOperations");

const CURRENCY_ID = "concordium_testnet";
const ACCOUNT_ID = "js:2:concordium_testnet:test:";

function createRawOpFixture(overrides?: Record<string, unknown>) {
  return {
    hash: "cc".repeat(32),
    type: "OUT",
    sender: VALID_ADDRESS,
    recipient: VALID_ADDRESS_2,
    amount: "1000000",
    fee: "100",
    value: "1000100",
    memo: undefined,
    date: new Date(),
    blockHash: "block-abc",
    blockHeight: 1000,
    failed: false,
    id: 101,
    ...overrides,
  };
}

describe("getBalances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return balance and spendableBalance from network", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000", accountAtDisposal: "9900000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(10000000));
    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
  });

  it("should calculate spendableBalance from balance minus minReserve when accountAtDisposal is missing", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
  });

  it("should clamp negative spendableBalance to 0", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "50000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should return zero balances on network error", async () => {
    getAccountBalance.mockRejectedValue(new Error("network error"));

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(0));
    expect(result.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should return zero for NaN balance values", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "invalid" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(0));
  });
});

describe("syncOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listOperations.mockResolvedValue({ items: [], next: undefined });
  });

  it("should fetch with minHeight 0 when no old operations", async () => {
    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, []);

    expect(listOperations).toHaveBeenCalledWith(
      VALID_ADDRESS,
      { minHeight: 0, limit: 100, order: "desc" },
      CURRENCY_ID,
    );
    expect(result).toEqual([]);
  });

  it("should use blockHeight + 1 from newest old operation as minHeight", async () => {
    const oldOp = createFixtureOperation({ blockHeight: 500 });

    await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp]);

    expect(listOperations).toHaveBeenCalledWith(
      VALID_ADDRESS,
      { minHeight: 501, limit: 100, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("should use minHeight 0 when newest operation has blockHeight 0", async () => {
    const oldOp = createFixtureOperation({ blockHeight: 0 });

    await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp]);

    expect(listOperations).toHaveBeenCalledWith(
      VALID_ADDRESS,
      { minHeight: 0, limit: 100, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("should map and merge new operations with old", async () => {
    const oldOp = createFixtureOperation({ id: "old-op", blockHeight: 100 });
    listOperations.mockResolvedValue({
      items: [createRawOpFixture()],
      next: undefined,
    });

    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp]);

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should return empty operations on listOperations failure", async () => {
    listOperations.mockRejectedValue(new Error("network error"));

    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, []);

    expect(result).toEqual([]);
  });
});

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getAccountsByPublicKey.mockResolvedValue([{ address: VALID_ADDRESS }]);
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000", accountAtDisposal: "9900000" },
    });
    listOperations.mockResolvedValue({ items: [], next: undefined });
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 5000 });
  });

  it("should return complete account shape for an onboarded account", async () => {
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.balance).toEqual(new BigNumber(10000000));
    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
    expect(result.freshAddress).toBe(VALID_ADDRESS);
    expect(result.concordiumResources?.isOnboarded).toBe(true);
    expect(result.concordiumResources?.publicKey).toBe(PUBLIC_KEY);
    expect(result.seedIdentifier).toBe(PUBLIC_KEY);
    expect(result.xpub).toBe(PUBLIC_KEY);
    expect(result.used).toBe(true);
  });

  it("should set blockHeight from chain tip via getConsensusInfo", async () => {
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 7500 });
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.blockHeight).toBe(7500);
  });

  it("should set blockHeight to 0 when getConsensusInfo fails", async () => {
    getConsensusInfo.mockRejectedValue(new Error("consensus error"));
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.blockHeight).toBe(0);
  });

  it("should return empty account shape when no accounts found on-chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([]);
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.balance).toEqual(new BigNumber(0));
    expect(result.spendableBalance).toEqual(new BigNumber(0));
    expect(result.concordiumResources?.isOnboarded).toBe(false);
    expect(result.used).toBe(false);
    expect(result.operations).toEqual([]);
  });

  it("should throw on network error when fetching accounts", async () => {
    getAccountsByPublicKey.mockRejectedValue(new Error("Network error"));
    const currency = createFixtureCurrency();

    await expect(
      getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "44'/1'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      }),
    ).rejects.toThrow("Network error");
  });

  it("should use publicKey from initialAccount when not in rest", async () => {
    const currency = createFixtureCurrency();
    const initialAccount = createTestConcordiumAccount({
      concordiumResources: {
        isOnboarded: false,
        publicKey: PUBLIC_KEY,
        credId: "",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    });

    await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
    });

    expect(getAccountsByPublicKey).toHaveBeenCalledWith(currency.id, PUBLIC_KEY);
  });

  it("should preserve derivationMode, derivationPath, and index", async () => {
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "concordium",
      derivationPath: "44'/1'/0'/0'/0'/5'",
      index: 5,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.derivationMode).toBe("concordium");
    expect(result.derivationPath).toBe("44'/1'/0'/0'/0'/5'");
    expect(result.index).toBe(5);
  });

  it("should preserve existing concordiumResources fields", async () => {
    const currency = createFixtureCurrency();
    const initialAccount = createTestConcordiumAccount({
      concordiumResources: {
        isOnboarded: false,
        publicKey: PUBLIC_KEY,
        credId: "existing-cred-id",
        identityIndex: 5,
        credNumber: 3,
        ipIdentity: 1,
      },
    });

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.concordiumResources?.credId).toBe("existing-cred-id");
    expect(result.concordiumResources?.identityIndex).toBe(5);
  });

  it("should fetch balances, operations, and chain height in parallel", async () => {
    const currency = createFixtureCurrency();
    const existingOp = createFixtureOperation({ blockHash: "existing-block" });
    const initialAccount = createTestConcordiumAccount({
      operations: [existingOp],
      concordiumResources: {
        isOnboarded: true,
        publicKey: PUBLIC_KEY,
        credId: "",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    });

    await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
    });

    expect(getAccountBalance).toHaveBeenCalled();
    expect(listOperations).toHaveBeenCalled();
    expect(getConsensusInfo).toHaveBeenCalledWith(currency.id);
  });
});
