import { faker } from "@faker-js/faker";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
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
    id: faker.string.uuid(),
    seedIdentifier: faker.string.uuid(),
    derivationMode: "",
    index: faker.number.int(),
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: faker.date.past(),
    blockHeight: faker.number.int({ min: 100_000, max: 200_000 }),
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

  const id = faker.string.uuid();

  return {
    type: "Account",
    id,
    seedIdentifier: faker.string.uuid(),
    derivationMode: "",
    index: faker.number.int(),
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: faker.date.past(),
    blockHeight: faker.number.int({ min: 100_000, max: 200_000 }),
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
