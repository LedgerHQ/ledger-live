import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { Transaction } from "../types";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";

jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("./utils/misc");
jest.mock("./utils/token");

describe("buildOptimisticOperation", () => {
  let encodeOperationIdSpy: jest.SpyInstance;
  let getAddressSpy: jest.SpyInstance;
  let getSubAccountSpy: jest.SpyInstance;

  const mockAccount = {
    id: "mock-account-id",
    name: "Mock Account",
    address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  } as unknown as Account;

  const mockSubAccount = {
    id: "mock-subaccount-id",
    name: "Mock Token Account",
    token: {
      id: "mock-token-id",
    },
    spendableBalance: new BigNumber(1000),
  };

  const mockTransaction = {
    family: "stacks",
    amount: new BigNumber(500),
    recipient: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    fee: new BigNumber(100),
    nonce: new BigNumber(5),
    memo: "Test transaction",
  } as unknown as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();

    encodeOperationIdSpy = jest.spyOn({ encodeOperationId }, "encodeOperationId");
    getAddressSpy = jest.spyOn({ getAddress }, "getAddress");
    getSubAccountSpy = jest.spyOn({ getSubAccount }, "getSubAccount");

    encodeOperationIdSpy.mockReturnValue("mock-operation-id");
    getAddressSpy.mockReturnValue({ address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" });
    getSubAccountSpy.mockReturnValue(null);
  });

  it("should build a standard transfer optimistic operation", () => {
    const operation = buildOptimisticOperation(mockAccount, mockTransaction);

    expect(encodeOperationIdSpy).toHaveBeenCalledWith("mock-account-id", "", "OUT");
    expect(operation).toEqual(
      expect.objectContaining({
        id: "mock-operation-id",
        hash: "",
        type: "OUT",
        senders: ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        recipients: ["ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        accountId: "mock-account-id",
        value: new BigNumber(600), // amount + fee
        fee: new BigNumber(100),
        blockHash: null,
        blockHeight: null,
        transactionSequenceNumber: 5,
        extra: {
          memo: "Test transaction",
        },
      }),
    );
  });

  it("should build a token transfer optimistic operation", () => {
    getSubAccountSpy.mockReturnValue(mockSubAccount);

    const operation = buildOptimisticOperation(mockAccount, mockTransaction);

    expect(encodeOperationIdSpy).toHaveBeenCalledWith("mock-subaccount-id", "", "OUT");
    expect(operation).toEqual(
      expect.objectContaining({
        id: "mock-operation-id",
        hash: "",
        type: "OUT",
        senders: ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        recipients: ["ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        accountId: "mock-subaccount-id",
        value: new BigNumber(500), // Just the amount for token transfers
        fee: new BigNumber(100),
        blockHash: null,
        blockHeight: null,
        transactionSequenceNumber: 5,
        extra: {
          memo: "Test transaction",
        },
      }),
    );
  });

  it("should handle missing fee by using 0", () => {
    const transactionWithoutFee = {
      ...mockTransaction,
      fee: undefined,
    } as unknown as Transaction;

    const operation = buildOptimisticOperation(mockAccount, transactionWithoutFee);

    expect(operation.fee).toEqual(new BigNumber(0));
    expect(operation.value).toEqual(new BigNumber(500)); // Just the amount since fee is 0
  });

  it("should handle missing nonce by using 0", () => {
    const transactionWithoutNonce = {
      ...mockTransaction,
      nonce: undefined,
    } as unknown as Transaction;

    const operation = buildOptimisticOperation(mockAccount, transactionWithoutNonce);

    expect(operation.transactionSequenceNumber).toEqual(0);
  });

  it("should use the provided operation type", () => {
    const operation = buildOptimisticOperation(mockAccount, mockTransaction, "IN");

    expect(encodeOperationIdSpy).toHaveBeenCalledWith("mock-account-id", "", "IN");
    expect(operation.type).toEqual("IN");
  });

  it("should fix spelling error in function parameter name", () => {
    const operation = buildOptimisticOperation(
      mockAccount,
      mockTransaction,
      "SELF" as OperationType,
    );

    expect(encodeOperationIdSpy).toHaveBeenCalledWith("mock-account-id", "", "SELF");
    expect(operation.type).toEqual("SELF");
  });
});
