import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import type { AptosAccount, Transaction } from "../types/index";

const currency = getCryptoCurrencyById("aptos");

export function createFixtureAccount(account?: Partial<AptosAccount>): AptosAccount {
  const freshAddress = {
    address: "address",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: "aptos:fixture-account",
    seedIdentifier: "fixture-seed",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date("2024-01-01"),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    aptosResources: {
      stakingPositions: [],
      activeBalance: BigNumber(0),
      inactiveBalance: BigNumber(0),
      pendingInactiveBalance: BigNumber(0),
    },
    ...account,
  };
}

export function createFixtureAccountWithSubAccount(
  tokenType: string,
  account?: Partial<AptosAccount>,
): AptosAccount {
  const freshAddress = {
    address: "address",
    derivationPath: "derivation_path",
  };

  const id = "aptos:fixture-account-sub";

  return {
    type: "Account",
    id,
    seedIdentifier: "fixture-seed",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date("2024-01-01"),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    subAccounts: [
      {
        id: "1",
        parentId: id,
        type: "TokenAccount",
        token: {
          type: "TokenCurrency",
          id: "aptToken",
          contractAddress: "contract_address",
          parentCurrency: currency,
          tokenType,
        } as TokenCurrency,
        balance: BigNumber(1000),
        spendableBalance: BigNumber(1000),
        creationDate: new Date(),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: emptyHistoryCache,
        swapHistory: [],
      },
    ],
    aptosResources: {
      stakingPositions: [],
      activeBalance: BigNumber(0),
      inactiveBalance: BigNumber(0),
      pendingInactiveBalance: BigNumber(0),
    },
    ...account,
  };
}

export function createFixtureTransaction(tx?: Partial<Transaction>): Transaction {
  const transaction: Transaction = {
    amount: new BigNumber(0),
    recipient: "recipient",
    useAllAmount: false,
    family: "aptos",
    mode: "send",
    fees: null,
    options: {
      maxGasAmount: BigNumber(0).toString(),
      gasUnitPrice: BigNumber(0).toString(),
    },
    ...tx,
  };

  return transaction;
}

export function createFixtureTransactionWithSubAccount(tx?: Partial<Transaction>): Transaction {
  const transaction: Transaction = {
    amount: new BigNumber(0),
    recipient: "recipient",
    useAllAmount: false,
    family: "aptos",
    mode: "send",
    fees: null,
    options: {
      maxGasAmount: BigNumber(0).toString(),
      gasUnitPrice: BigNumber(0).toString(),
    },
    subAccountId: "1",
    ...tx,
  };

  return transaction;
}
