import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import type { AptosAccount, Transaction } from "../types/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";

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
    freshAddress: account?.freshAddress || freshAddress.address,
    freshAddressPath: account?.freshAddressPath || freshAddress.derivationPath,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: faker.date.past(),
    blockHeight: faker.number.int({ min: 100_000, max: 200_000 }),
    currency,
    operationsCount: account?.operationsCount || 0,
    operations: account?.operations || [],
    pendingOperations: account?.pendingOperations || [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

export function createFixtureTransaction(tx?: Partial<Transaction>): Transaction {
  const transaction: Transaction = {
    amount: tx?.amount || new BigNumber(0),
    recipient: tx?.recipient || "",
    useAllAmount: tx?.useAllAmount || false,
    family: "aptos",
    mode: tx?.mode || "send",
    fees: tx?.fees || null,
    options: {
      maxGasAmount: BigNumber(0).toString(),
      gasUnitPrice: BigNumber(0).toString(),
    },
  };

  return transaction;
}
