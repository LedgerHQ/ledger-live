import { faker } from "@faker-js/faker";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import type {
  TezosAccount,
  TezosOperation,
  TezosOperationExtra,
  TezosResources,
  Transaction,
} from "./bridge";

const currency = listCryptoCurrencies(true).find(c => c.id === "tezos")!;

export function createFixtureAccount(account?: Partial<TezosAccount>): TezosAccount {
  const tezosResources: TezosResources = account?.tezosResources || {
    revealed: account?.tezosResources?.revealed || true,
    counter: account?.tezosResources?.counter || faker.number.int(),
  };

  const freshAddress = {
    // Value coming from taquito.io documentation
    address: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: faker.string.uuid(),
    seedIdentifier: faker.string.uuid(),
    derivationMode: "",
    index: faker.number.int(),
    freshAddress: account?.freshAddress || freshAddress.address,
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

    tezosResources,
    stakingPositions: account?.stakingPositions || [],
  };
}

export function createFixtureTransaction(tx?: Partial<Transaction>): Transaction {
  return {
    amount: tx?.amount || new BigNumber(0),
    recipient: tx?.recipient || getAbandonSeedAddress("tezos"),
    useAllAmount: tx?.useAllAmount || false,

    family: "tezos",
    mode: tx?.mode || "send",
    networkInfo: tx?.networkInfo || undefined,
    fees: tx?.fees || undefined,
    gasLimit: tx?.gasLimit || undefined,
    storageLimit: tx?.storageLimit || undefined,
    estimatedFees: tx?.estimatedFees || undefined,
    taquitoError: tx?.taquitoError || undefined,
  };
}

export function createFixtureOperation(operation?: Partial<TezosOperation>): TezosOperation {
  const extra: TezosOperationExtra = {
    id: operation?.extra?.id || 0,
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
