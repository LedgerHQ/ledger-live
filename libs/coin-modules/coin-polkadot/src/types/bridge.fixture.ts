import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";
import {
  PalletMethod,
  PolkadotAccount,
  PolkadotOperation,
  PolkadotOperationExtra,
  PolkadotResources,
  Transaction,
} from "../types";
import { POLKADOT_NULL_ADDRESS } from "../constants";

export function createFixtureAccount(account?: Partial<PolkadotAccount>): PolkadotAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "polkadot")!;

  const polkadotResources: PolkadotResources = account?.polkadotResources || {
    controller: account?.polkadotResources?.controller || undefined,
    stash: account?.polkadotResources?.stash || undefined,
    nonce: 0,
    lockedBalance: new BigNumber(0),
    unlockedBalance: new BigNumber(0),
    unlockingBalance: new BigNumber(0),
    unlockings: undefined,
    nominations: undefined,
    numSlashingSpans: 0,
  };

  const freshAddress = {
    // Value coming from Polkadot.js test: https://github.com/polkadot-js/api/blob/master/packages/types/src/primitive/StorageKey.spec.ts
    address: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
    derivationPath: "derivation_path",
  };

  const id = "polkadot:fixture-account";
  const seedIdentifier = "fixture-seed";
  const index = 0;

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
    creationDate: new Date("2024-01-01"),
    blockHeight: 100_000,
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
    recipient: tx?.recipient || POLKADOT_NULL_ADDRESS,

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
    id: operation?.id || "polkadot:fixture-op",
    hash: operation?.hash || "0x" + "0".repeat(64),
    type: operation?.type || "ACTIVATE",
    value: operation?.value || new BigNumber(0),
    fee: operation?.fee || new BigNumber(0),
    // senders & recipients addresses
    senders: operation?.senders || [],
    recipients: operation?.recipients || [],
    blockHeight: operation?.blockHeight || undefined,
    blockHash: operation?.blockHash || undefined,
    accountId: operation?.accountId || "polkadot:fixture-account",
    date: operation?.date || new Date("2024-01-01"),
    extra,
  };
}
