import BigNumber from "bignumber.js";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { addPendingOperation } from "./pending";
import { emptyHistoryCache } from "./balanceHistoryCache";

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

function createOperation(accountId: string): Operation {
  return {
    id: "",
    hash: "",
    type: "ACTIVATE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    // senders & recipients addresses
    senders: [],
    recipients: [],
    blockHeight: undefined,
    blockHash: undefined,
    accountId,
    date: new Date(),
    extra: null,
  };
}
