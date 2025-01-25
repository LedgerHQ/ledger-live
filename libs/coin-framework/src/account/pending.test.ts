import BigNumber from "bignumber.js";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { addPendingOperation, shouldRetainPendingOperation } from "./pending";
import { emptyHistoryCache } from "./balanceHistoryCache";
import { getEnv } from "@ledgerhq/live-env";

describe("addPendingOperation", () => {
  it("add the operation to the matching account Id", () => {
    // Given
    const account = createAccount("12");
    const subAccount = createTokenAccount("12.1");
    account.subAccounts = [subAccount];
    const op = createOperation("12");

    // When
    const result = addPendingOperation(account, op);

    // Then
    expect(result).not.toBe(account);
    expect(result.pendingOperations).toContain(op);
    const resultSubAcc = result?.subAccounts;
    expect(resultSubAcc).not.toBeFalsy();
    expect(resultSubAcc).not.toBe(subAccount);
    expect(resultSubAcc![0].pendingOperations).not.toContain(op);
  });

  it("add the operation to the matching subAccount Id", () => {
    // Given
    const account = createAccount("12");
    const subAccount = createTokenAccount("12.1");
    account.subAccounts = [subAccount];
    const op = createOperation("12.1");

    // When
    const result = addPendingOperation(account, op);

    // Then
    expect(result).not.toBe(account);
    expect(result.pendingOperations).not.toContain(op);
    const resultSubAcc = result?.subAccounts;
    expect(resultSubAcc).not.toBeFalsy();
    expect(resultSubAcc).not.toBe(subAccount);
    expect(resultSubAcc![0].pendingOperations).toContain(op);
  });

  it("lose an operation if the id doesn't match account and subaccount", () => {
    // Given
    const account = createAccount("12");
    const subAccount = createTokenAccount("12.1");
    account.subAccounts = [subAccount];
    const op = createOperation("13");

    // When
    const result = addPendingOperation(account, op);

    // Then
    expect(result).not.toBe(account);
    expect(result.pendingOperations).not.toContain(op);
    const resultSubAcc = result?.subAccounts;
    expect(resultSubAcc).not.toBeFalsy();
    expect(resultSubAcc).not.toBe(subAccount);
    expect(resultSubAcc![0].pendingOperations).not.toContain(op);
  });
});

describe("shouldRetainPendingOperation", () => {
  it("should retain the operation if no prior operations exist", () => {
    // Given
    const account = createAccount("12");
    const date = new Date();
    const op = createOperation("12", [], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);
    // Then
    expect(shouldRetainPending).toBe(true);
  });

  it("should retain the operation with a lower transactionSequenceNumber than the last operation", () => {
    // Given
    const account = createAccount("12");
    const date = new Date();
    account.operations = [createOperation("12", [account.freshAddress], 1, date)];
    const op = createOperation("12", [account.freshAddress], 2, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);
    // Then
    expect(shouldRetainPending).toBe(true);
  });

  it("should not retain the operation with a higher transactionSequenceNumber than the last operation", () => {
    // Given
    const account = createAccount("12");
    const date = new Date();
    account.operations = [createOperation("12", [account.freshAddress], 2, date)];
    const op = createOperation("12", [account.freshAddress], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);
    // Then
    expect(shouldRetainPending).toBe(false);
  });

  it("should not retain the operation if last operation has no matching sender", () => {
    // Given
    const account = createAccount("12");
    const date = new Date(getEnv("OPERATION_OPTIMISTIC_RETENTION") + 1);
    account.operations = [createOperation("12", [], 1, date)];
    const op = createOperation("12", [account.freshAddress], 3, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);
    // Then
    expect(shouldRetainPending).toBe(false);
  });

  it("should not retain the operation if delay exceeds the optimistic retention threshold", () => {
    // Given
    const account = createAccount("12");
    const retentionThreshold = getEnv("OPERATION_OPTIMISTIC_RETENTION");
    const date = new Date(Date.now() - retentionThreshold - 1); // Exceeds threshold
    const op = createOperation("12", [account.freshAddress], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);

    // Then
    expect(shouldRetainPending).toBe(false);
  });

  it("should retain the operation if delay is within the optimistic retention threshold", () => {
    // Given
    const account = createAccount("12");
    const retentionThreshold = getEnv("OPERATION_OPTIMISTIC_RETENTION");
    const date = new Date(Date.now() - retentionThreshold + 1); // Within threshold
    const op = createOperation("12", [account.freshAddress], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);

    // Then
    expect(shouldRetainPending).toBe(true);
  });

  it("should retain the operation if transactionSequenceNumber is undefined in last operation", () => {
    // Given
    const account = createAccount("12");
    const date = new Date();
    account.operations = [createOperation("12", [account.freshAddress], undefined, date)];
    const op = createOperation("12", [account.freshAddress], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);

    // Then
    expect(shouldRetainPending).toBe(true);
  });

  it("should retain the operation if senders are empty in both the operation and last operation", () => {
    // Given
    const account = createAccount("12");
    const date = new Date();
    account.operations = [createOperation("12", [], 1, date)];
    const op = createOperation("12", [], 1, date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);

    // Then
    expect(shouldRetainPending).toBe(true);
  });
});

function createAccount(id: string): Account {
  const currency = listCryptoCurrencies(true)[0];

  return {
    type: "Account",
    id,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    // subAccounts: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

function createTokenAccount(id: string): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId: "",
    token: {} as unknown as TokenCurrency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

function createOperation(
  accountId: string,
  sender?: string[],
  sequenceNumber?: number,
  date?: Date,
): Operation {
  return {
    id: "",
    hash: "",
    type: "ACTIVATE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    // senders & recipients addresses
    senders: sender || [],
    recipients: [],
    blockHeight: undefined,
    blockHash: undefined,
    transactionSequenceNumber: sequenceNumber,
    accountId,
    date: date || new Date(),
    extra: null,
  };
}
