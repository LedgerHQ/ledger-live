/**
 * Shared test fixtures for Concordium coin module.
 *
 * Usage:
 *   import { createFixtureAccount, createFixtureTransaction, VALID_ADDRESS } from "../test/fixtures";
 *   const account = createFixtureAccount({ balance: new BigNumber(5000) });
 */
import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "../types";

// Valid Concordium addresses for testing
export const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";
export const VALID_ADDRESS_2 = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

// 64 hex characters (32 bytes) - standard Ed25519 public key length
export const PUBLIC_KEY = "aa".repeat(32);

// 96 hex characters (48 bytes) - standard credential ID length
export const CRED_ID = "cc".repeat(48);

export function createFixtureCurrency(overrides?: Partial<CryptoCurrency>): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: "concordium",
    name: "Concordium",
    family: "concordium",
    ticker: "CCD",
    scheme: "concordium",
    color: "#000000",
    units: [{ name: "CCD", code: "CCD", magnitude: 6 }],
    managerAppName: "Concordium",
    ...overrides,
  } as CryptoCurrency;
}

export function createFixtureAccount(overrides?: Partial<Account>): Account {
  return {
    type: "Account",
    id: "js:2:concordium:3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w:",
    seedIdentifier: PUBLIC_KEY,
    xpub: PUBLIC_KEY,
    derivationMode: "",
    index: 0,
    currency: createFixtureCurrency(),
    freshAddress: VALID_ADDRESS,
    freshAddressPath: "m/1105'/0'/0'/0'/0'/0'",
    balance: new BigNumber(10000000),
    spendableBalance: new BigNumber(9900000),
    blockHeight: 1000,
    creationDate: new Date("2024-01-01"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    subAccounts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    ...overrides,
  } as Account;
}

export function createFixtureTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "concordium",
    amount: new BigNumber(1000000),
    recipient: VALID_ADDRESS,
    fee: new BigNumber(1000),
    useAllAmount: false,
    memo: undefined,
    ...overrides,
  } as Transaction;
}

export function createFixtureOperation(overrides?: Partial<Operation>): Operation {
  return {
    id: "js:2:concordium:addr:tx-1",
    hash: "tx-hash-1",
    type: "OUT",
    value: new BigNumber(1000000),
    fee: new BigNumber(1000),
    senders: [VALID_ADDRESS],
    recipients: [VALID_ADDRESS_2],
    blockHeight: 1000,
    blockHash: "block-hash-1",
    accountId: "js:2:concordium:addr:",
    date: new Date("2024-01-01"),
    extra: {},
    transactionSequenceNumber: new BigNumber(1),
    ...overrides,
  } as Operation;
}
