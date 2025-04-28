import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import type { StellarAccount, StellarOperation, StellarOperationExtra, Transaction } from "./index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";

const currency = getCryptoCurrencyById("stellar");

export function createFixtureAccount(account?: Partial<StellarAccount>): StellarAccount {
  const freshAddress = {
    address: "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX",
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
  let transaction: Transaction = {
    amount: tx?.amount || new BigNumber(0),
    recipient: tx?.recipient || getAbandonSeedAddress("stellar"),
    useAllAmount: tx?.useAllAmount || false,

    family: "stellar",
    mode: tx?.mode || "send",
    networkInfo: tx?.networkInfo || undefined,
    fees: tx?.fees || null,
    baseReserve: tx?.baseReserve || null,
    memoType: tx?.memoType || null,
    memoValue: tx?.memoValue || null,
  };

  if (tx?.assetCode) {
    transaction = {
      ...transaction,
      assetCode: tx.assetCode,
    };
  }
  if (tx?.assetIssuer) {
    transaction = {
      ...transaction,
      assetIssuer: tx.assetIssuer,
    };
  }

  return transaction;
}

export function createFixtureOperation(operation?: Partial<StellarOperation>): StellarOperation {
  let extra: StellarOperationExtra = {
    assetAmount: operation?.extra?.assetAmount || undefined,
    ledgerOpType: operation?.extra?.ledgerOpType || "IN",
    blockTime: operation?.extra?.blockTime || faker.date.past(),
    index: operation?.id ?? "0",
  };
  if (operation?.extra?.pagingToken) {
    extra = {
      ...extra,
      pagingToken: operation.extra.pagingToken,
    };
  }
  if (operation?.extra?.assetCode) {
    extra = {
      ...extra,
      assetCode: operation.extra.assetCode,
    };
  }
  if (operation?.extra?.assetIssuer) {
    extra = {
      ...extra,
      assetIssuer: operation.extra.assetIssuer,
    };
  }
  if (operation?.extra?.memo) {
    extra = {
      ...extra,
      memo: operation.extra.memo,
    };
  }

  return {
    id: operation?.id || faker.string.uuid(),
    hash: operation?.hash || faker.string.uuid(),
    type: operation?.type || "ACTIVATE",
    value: operation?.value || new BigNumber(faker.string.numeric()),
    fee: operation?.fee || new BigNumber(0),
    // senders & recipients addresses
    senders: operation?.senders || [],
    recipients: operation?.recipients || [],
    blockHeight: operation?.blockHeight || undefined,
    blockHash: operation?.blockHash || undefined,
    accountId: operation?.accountId || faker.string.uuid(),
    date: operation?.date || faker.date.past(),
    extra,
  };
}
