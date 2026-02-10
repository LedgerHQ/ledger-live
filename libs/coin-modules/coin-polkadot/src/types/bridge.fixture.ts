import { faker } from "@faker-js/faker";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import {
  PalletMethod,
  PolkadotAccount,
  PolkadotOperation,
  PolkadotOperationExtra,
  PolkadotResources,
  Transaction,
} from "../types";

export function createFixtureAccount(account?: Partial<PolkadotAccount>): PolkadotAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "polkadot")!;

  const polkadotResources: PolkadotResources = account?.polkadotResources || {
    controller: account?.polkadotResources?.controller || undefined,
    stash: account?.polkadotResources?.stash || undefined,
    nonce: faker.number.int(100_000),
    lockedBalance: new BigNumber(faker.string.numeric()),
    unlockedBalance: new BigNumber(faker.string.numeric()),
    unlockingBalance: new BigNumber(faker.string.numeric()),
    unlockings: undefined,
    nominations: undefined,
    numSlashingSpans: faker.number.int(10),
  };

  const freshAddress = {
    // Value coming from Polkadot.js test: https://github.com/polkadot-js/api/blob/master/packages/types/src/primitive/StorageKey.spec.ts
    address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
    derivationPath: "derivation_path",
  };

  const id = faker.string.uuid();
  const seedIdentifier = faker.string.uuid();
  const index = faker.number.int();
  faker.string.alpha(); // there used to be a name and to not break the test, we need to consume it

  return {
    type: "Account",
    id,
    seedIdentifier,
    derivationMode: "",
    index,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
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
    polkadotResources,
  };
}

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

export function createFixtureOperation(operation?: Partial<PolkadotOperation>): PolkadotOperation {
  const extra: PolkadotOperationExtra = {
    transferAmount: operation?.extra?.transferAmount || new BigNumber(0),
    palletMethod: operation?.extra?.palletMethod || ("" as PalletMethod),
  };

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
