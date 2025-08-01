import { createTransaction } from "./createTransaction";
import { Account } from "@ledgerhq/types-live";
import { generateNonce } from "../common-logic";
import { MAINNET_CHAIN_TAG } from "../types";
import BigNumber from "bignumber.js";

// Mock dependencies
jest.mock("../common-logic");
jest.mock("../types", () => ({
  ...jest.requireActual("../types"),
  MAINNET_CHAIN_TAG: 74,
}));

const mockedGenerateNonce = jest.mocked(generateNonce);

describe("createTransaction", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"),
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {} as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGenerateNonce.mockReturnValue("0x1234567890abcdef");
  });

  it("should create a transaction with correct default values", () => {
    const result = createTransaction(mockAccount);

    expect(result).toEqual({
      family: "vechain",
      body: {
        chainTag: 74,
        blockRef: "0x0000000000000000",
        expiration: 18,
        clauses: [],
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        gas: "0",
        dependsOn: null,
        nonce: "0x1234567890abcdef",
      },
      amount: new BigNumber(0),
      estimatedFees: "0",
      recipient: "",
      useAllAmount: false,
    });
  });

  it("should use MAINNET_CHAIN_TAG for chainTag", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.chainTag).toBe(MAINNET_CHAIN_TAG);
    expect(result.body.chainTag).toBe(74);
  });

  it("should generate a unique nonce for each transaction", () => {
    mockedGenerateNonce
      .mockReturnValueOnce("0x1111111111111111")
      .mockReturnValueOnce("0x2222222222222222")
      .mockReturnValueOnce("0x3333333333333333");

    const tx1 = createTransaction(mockAccount);
    const tx2 = createTransaction(mockAccount);
    const tx3 = createTransaction(mockAccount);

    expect(tx1.body.nonce).toBe("0x1111111111111111");
    expect(tx2.body.nonce).toBe("0x2222222222222222");
    expect(tx3.body.nonce).toBe("0x3333333333333333");
    expect(mockedGenerateNonce).toHaveBeenCalledTimes(3);
  });

  it("should create transaction with empty clauses array", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.clauses).toEqual([]);
    expect(Array.isArray(result.body.clauses)).toBe(true);
  });

  it("should set default expiration to 18", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.expiration).toBe(18);
  });

  it("should set default blockRef to zero", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.blockRef).toBe("0x0000000000000000");
  });

  it("should set default gas values to zero", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.maxFeePerGas).toBe(0);
    expect(result.body.maxPriorityFeePerGas).toBe(0);
    expect(result.body.gas).toBe("0");
  });

  it("should set dependsOn to null", () => {
    const result = createTransaction(mockAccount);

    expect(result.body.dependsOn).toBe(null);
  });

  it("should create BigNumber amount with zero value", () => {
    const result = createTransaction(mockAccount);

    expect(result.amount).toBeInstanceOf(BigNumber);
    expect(result.amount.isZero()).toBe(true);
    expect(result.amount.toString()).toBe("0");
  });

  it("should set default recipient to empty string", () => {
    const result = createTransaction(mockAccount);

    expect(result.recipient).toBe("");
  });

  it("should set useAllAmount to false", () => {
    const result = createTransaction(mockAccount);

    expect(result.useAllAmount).toBe(false);
  });

  it("should set estimatedFees to zero string", () => {
    const result = createTransaction(mockAccount);

    expect(result.estimatedFees).toBe("0");
    expect(typeof result.estimatedFees).toBe("string");
  });

  it("should set family to vechain", () => {
    const result = createTransaction(mockAccount);

    expect(result.family).toBe("vechain");
  });

  it("should call generateNonce exactly once", () => {
    createTransaction(mockAccount);

    expect(mockedGenerateNonce).toHaveBeenCalledTimes(1);
    expect(mockedGenerateNonce).toHaveBeenCalledWith();
  });

  it("should handle different nonce formats from generateNonce", () => {
    const testNonces = [
      "0x0000000000000000",
      "0xffffffffffffffff",
      "0x123456789abcdef0",
      "0xa1b2c3d4e5f67890",
    ];

    testNonces.forEach(nonce => {
      mockedGenerateNonce.mockReturnValueOnce(nonce);
      const result = createTransaction(mockAccount);
      expect(result.body.nonce).toBe(nonce);
    });
  });

  it("should create independent transaction objects", () => {
    mockedGenerateNonce
      .mockReturnValueOnce("0x1111111111111111")
      .mockReturnValueOnce("0x2222222222222222");

    const tx1 = createTransaction(mockAccount);
    const tx2 = createTransaction(mockAccount);

    // Modify one transaction
    tx1.amount = new BigNumber(100);
    tx1.recipient = "0x123";
    tx1.body.clauses.push({
      to: "0x123",
      value: "100",
      data: "0x",
    });

    // Verify the other transaction is unchanged
    expect(tx2.amount.isZero()).toBe(true);
    expect(tx2.recipient).toBe("");
    expect(tx2.body.clauses).toEqual([]);
  });
});
