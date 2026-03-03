/**
 * Test helpers and utilities for Concordium tests
 *
 * This file provides properly-typed test fixtures to avoid using `as any`
 * in test files, making tests more type-safe and maintainable.
 */

import type { AccountLike, Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "../types";

/**
 * Parameters for getDeviceTransactionConfig function
 */
export type DeviceTransactionConfigParams = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
};

/**
 * Create minimal DeviceTransactionConfig params for testing
 */
export function createDeviceTransactionConfigParams(
  overrides?: Partial<DeviceTransactionConfigParams>,
): DeviceTransactionConfigParams {
  return {
    account: {} as AccountLike,
    parentAccount: null,
    transaction: createTestTransaction(),
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    },
    ...overrides,
  };
}

/**
 * Create minimal Transaction for testing
 */
export function createTestTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "concordium",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fee: undefined,
    memo: undefined,
    ...overrides,
  };
}

/**
 * Create minimal TransactionStatus for testing
 */
export function createTestTransactionStatus(
  overrides?: Partial<TransactionStatus>,
): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    ...overrides,
  };
}

/**
 * Create minimal Account for testing
 */
export function createTestAccount(overrides?: Partial<Account>): Account {
  return {
    type: "Account",
    id: "test-account-id",
    seedIdentifier: "test-seed",
    derivationMode: "",
    index: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/0'/0'/0/0",
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: {
      type: "CryptoCurrency",
      id: "concordium",
      coinType: 919,
      name: "Concordium",
      managerAppName: "Concordium",
      ticker: "CCD",
      scheme: "concordium",
      color: "#000000",
      family: "concordium",
      units: [
        {
          name: "CCD",
          code: "CCD",
          magnitude: 6,
        },
      ],
      explorerViews: [],
    },
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    ...overrides,
  };
}

/**
 * Create minimal ConcordiumAccount for testing
 */
export function createTestConcordiumAccount(
  overrides?: Partial<import("../types").ConcordiumAccount>,
): import("../types").ConcordiumAccount {
  return {
    ...createTestAccount(),
    concordiumResources: {
      isOnboarded: false,
      credId: "",
      publicKey: "",
      identityIndex: 0,
      credNumber: 0,
      ipIdentity: 0,
    },
    ...overrides,
  };
}

/**
 * Create minimal AccountRaw for testing
 */
export function createTestAccountRaw(
  overrides?: Partial<import("@ledgerhq/types-live").AccountRaw>,
): import("@ledgerhq/types-live").AccountRaw {
  return {
    id: "test-account-id",
    seedIdentifier: "test-seed",
    derivationMode: "",
    index: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/0'/0'/0/0",
    blockHeight: 0,
    creationDate: new Date().toISOString(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "concordium",
    balance: "0",
    spendableBalance: "0",
    lastSyncDate: new Date().toISOString(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    ...overrides,
  };
}

/**
 * Create minimal ConcordiumAccountRaw for testing
 */
export function createTestConcordiumAccountRaw(
  overrides?: Partial<import("../types").ConcordiumAccountRaw>,
): import("../types").ConcordiumAccountRaw {
  return {
    ...createTestAccountRaw({ currencyId: "concordium" }),
    concordiumResources: {
      isOnboarded: false,
      credId: "",
      publicKey: "",
      identityIndex: 0,
      credNumber: 0,
      ipIdentity: 0,
    },
    ...overrides,
  };
}

/**
 * Create minimal CryptoCurrency for testing
 */
export function createTestCryptoCurrency(
  overrides?: Partial<import("@ledgerhq/types-cryptoassets").CryptoCurrency>,
): import("@ledgerhq/types-cryptoassets").CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: "concordium",
    coinType: 919,
    name: "Concordium",
    managerAppName: "Concordium",
    ticker: "CCD",
    scheme: "concordium",
    color: "#000000",
    family: "concordium",
    units: [
      {
        name: "CCD",
        code: "CCD",
        magnitude: 6,
      },
    ],
    explorerViews: [],
    ...overrides,
  };
}

/**
 * Create minimal CommitmentsRandomness for testing
 */
export function createTestCommitmentsRandomness(
  overrides?: Partial<import("../types").CommitmentsRandomness>,
): import("../types").CommitmentsRandomness {
  return {
    idCredSecRand: "",
    prfRand: "",
    credCounterRand: "",
    maxAccountsRand: "",
    attributesRand: {},
    ...overrides,
  };
}
