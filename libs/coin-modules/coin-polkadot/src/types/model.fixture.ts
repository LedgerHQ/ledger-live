import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { PolkadotAccount, PolkadotOperationExtra, PolkadotResources, Transaction } from "../types";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { Operation } from "@ledgerhq/types-live";

export function createFixtureAccount(account?: Partial<PolkadotAccount>): PolkadotAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "polkadot")!;

  const polkadotResources: PolkadotResources = account?.polkadotResources || {
    controller: undefined,
    stash: account?.polkadotResources?.stash || undefined,
    nonce: faker.number.int(100_000),
    lockedBalance: new BigNumber(faker.string.numeric()),
    unlockedBalance: new BigNumber(faker.string.numeric()),
    unlockingBalance: new BigNumber(faker.string.numeric()),
    unlockings: undefined,
    nominations: undefined,
    numSlashingSpans: faker.number.int(),
  };

  const freshAddress = {
    // Value coming from Polkadot.js test: https://github.com/polkadot-js/api/blob/master/packages/types/src/primitive/StorageKey.spec.ts
    address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
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
    freshAddresses: [freshAddress],
    name: faker.string.alpha(),
    starred: false,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: faker.date.past(),
    blockHeight: faker.number.int({ min: 100_000, max: 200_000 }),
    currency,
    unit: currency.units[0],
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    polkadotResources,
  };
}

const emptyHistoryCache = {
  HOUR: {
    latestDate: null,
    balances: [],
  },
  DAY: {
    latestDate: null,
    balances: [],
  },
  WEEK: {
    latestDate: null,
    balances: [],
  },
};

export function createFixtureTransaction(tx?: Partial<Transaction>): Transaction {
  return {
    amount: tx?.amount || new BigNumber(0),
    recipient: tx?.recipient || getAbandonSeedAddress("polkadot"),

    mode: tx?.mode || "send",
    family: "polkadot",
    fees: tx?.fees || undefined,
    validators: tx?.validators || undefined,
    era: tx?.era || undefined,
    rewardDestination: tx?.rewardDestination || undefined,
    numSlashingSpans: tx?.numSlashingSpans || undefined,
  };
}

export function createFixtureOperation(): Operation {
  const extra: PolkadotOperationExtra = {
    transferAmount: new BigNumber(0),
    palletMethod: "",
  };

  return {
    id: faker.string.uuid(),
    hash: faker.string.uuid(),
    type: "ACTIVATE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    // senders & recipients addresses
    senders: [],
    recipients: [],
    blockHeight: undefined,
    blockHash: undefined,
    accountId: faker.string.uuid(),
    date: faker.date.past(),
    extra,
  };
}
