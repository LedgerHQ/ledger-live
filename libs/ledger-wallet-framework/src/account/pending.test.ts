import BigNumber from "bignumber.js";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import type { CryptoCurrency, TokenCurrency } from "../types";
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
    const op = createOperation("12", [], BigInt(1), date);

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
    account.operations = [createOperation("12", [account.freshAddress], BigInt(1), date)];
    const op = createOperation("12", [account.freshAddress], BigInt(2), date);

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
    account.operations = [createOperation("12", [account.freshAddress], BigInt(2), date)];
    const op = createOperation("12", [account.freshAddress], BigInt(1), date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);
    // Then
    expect(shouldRetainPending).toBe(false);
  });

  it.each([
    [9, 10],
    [99, 100],
    [999, 1000],
    [9999, 10000],
  ])(
    "should retain when op's transactionSequenceNumber numerically exceeds last's across digit boundary (last=%i, op=%i)",
    (lastSeq, opSeq) => {
      const account = createAccount("12");
      const date = new Date();
      account.operations = [createOperation("12", [account.freshAddress], BigInt(lastSeq), date)];
      const op = createOperation("12", [account.freshAddress], BigInt(opSeq), date);

      const result = addPendingOperation(account, op);
      expect(shouldRetainPendingOperation(result, op)).toBe(true);
    },
  );

  it("should not retain when op's transactionSequenceNumber equals last's", () => {
    const account = createAccount("12");
    const date = new Date();
    account.operations = [createOperation("12", [account.freshAddress], BigInt(100), date)];
    const op = createOperation("12", [account.freshAddress], BigInt(100), date);

    expect(shouldRetainPendingOperation(account, op)).toBe(false);
  });

  it("should not retain the operation if last operation has no matching sender", () => {
    // Given
    const account = createAccount("12");
    const date = new Date(getEnv("OPERATION_OPTIMISTIC_RETENTION") + 1);
    account.operations = [createOperation("12", [], BigInt(1), date)];
    const op = createOperation("12", [account.freshAddress], BigInt(3), date);

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
    const op = createOperation("12", [account.freshAddress], BigInt(1), date);

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
    const date = new Date(Date.now() - retentionThreshold + 1000); // Within threshold (1s buffer)
    const op = createOperation("12", [account.freshAddress], BigInt(1), date);

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
    const op = createOperation("12", [account.freshAddress], BigInt(1), date);

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
    account.operations = [createOperation("12", [], BigInt(1), date)];
    const op = createOperation("12", [], BigInt(1), date);

    // When
    const result = addPendingOperation(account, op);
    const shouldRetainPending = shouldRetainPendingOperation(result, op);

    // Then
    expect(shouldRetainPending).toBe(true);
  });

  it("keeps the pending UTXO operations that spend different inputs", () => {
    const account = createAccount("12");
    const tx1 = { ...createOperation("12"), hash: "tx1", extra: { inputs: ["utxoA-0"] } };
    const tx2 = { ...createOperation("12"), hash: "tx2", extra: { inputs: ["utxoB-1"] } };

    const result = addPendingOperation(addPendingOperation(account, tx1), tx2);

    expect(result.pendingOperations).toEqual([tx2, tx1]);
  });

  it("replaces the pending UTXO operation whose input the new one spends (RBF)", () => {
    const account = createAccount("12");
    const original = {
      ...createOperation("12"),
      hash: "original",
      extra: { inputs: ["utxoA-0", "utxoB-1"] },
    };
    const other = { ...createOperation("12"), hash: "other", extra: { inputs: ["utxoC-0"] } };
    const replacement = {
      ...createOperation("12"),
      hash: "replacement",
      extra: { inputs: ["utxoA-0", "utxoB-1"] },
    };

    const result = [original, other, replacement].reduce(addPendingOperation, account);

    expect(result.pendingOperations).toEqual([replacement, other]);
  });

  it("removes the unconfirmed descendants of a replaced UTXO operation", () => {
    const account = createAccount("12");
    const parent = { ...createOperation("12"), hash: "parent", extra: { inputs: ["utxoA-0"] } };
    const child = {
      ...createOperation("12"),
      hash: "child",
      extra: { inputs: ["parent-1", "utxoC-0"] },
    };
    const grandchild = {
      ...createOperation("12"),
      hash: "grandchild",
      extra: { inputs: ["child-0"] },
    };
    const unrelated = {
      ...createOperation("12"),
      hash: "unrelated",
      extra: { inputs: ["utxoD-0"] },
    };
    const replacement = {
      ...createOperation("12"),
      hash: "replacement",
      extra: { inputs: ["utxoA-0"] },
    };

    const result = [parent, child, grandchild, unrelated, replacement].reduce(
      addPendingOperation,
      account,
    );

    expect(result.pendingOperations).toEqual([replacement, unrelated]);
  });

  it("replaces the pending operation when neither has a sequence number nor inputs", () => {
    const account = createAccount("12");
    const op1 = { ...createOperation("12"), hash: "op1" };
    const op2 = { ...createOperation("12"), hash: "op2" };

    const result = addPendingOperation(addPendingOperation(account, op1), op2);

    expect(result.pendingOperations).toEqual([op2]);
  });

  it("should replace existing pending operation with same transactionSequenceNumber", () => {
    const account = createAccount("12");
    const op1 = createOperation("12", ["addr"], BigInt(5));
    const op2 = createOperation("12", ["addr"], BigInt(5)); // same sequence

    const result = addPendingOperation(addPendingOperation(account, op1), op2);

    expect(result.pendingOperations.length).toBe(1);
    expect(result.pendingOperations[0]).toBe(op2);
  });

  it("should remove the pending operation when confirmed version appears in second sync", () => {
    const account = createAccount("12");
    const now = new Date();
    const senders = ["abc"];

    // First sync: we get a pending operation
    const pendingOp = createOperation("12", senders, BigInt(42), now);
    const withPending = addPendingOperation(account, pendingOp);

    expect(withPending.pendingOperations).toHaveLength(1);
    expect(withPending.pendingOperations[0]).toBe(pendingOp);

    // Second sync: confirmed operation shows up in the history
    const confirmedOp: Operation = {
      ...pendingOp,
      blockHeight: 100,
      blockHash: "blockhash",
    };
    withPending.operations.push(confirmedOp);

    // Should not retain pending now
    const retain = shouldRetainPendingOperation(withPending, pendingOp);
    expect(retain).toBe(false);
  });
});

export function createAccount(id: string): Account {
  const currency = listCryptoCurrencies(true)[0] as unknown as CryptoCurrency;

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

export function createOperation(
  accountId: string,
  sender?: string[],
  sequenceNumber?: bigint,
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
    transactionSequenceNumber:
      typeof sequenceNumber === "bigint" ? new BigNumber(sequenceNumber.toString()) : undefined,
    accountId,
    date: date || new Date(),
    extra: null,
  };
}
