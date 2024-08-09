import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { IconAccount, IconOperation, IconResources, Transaction } from "./index";

export function createFixtureAccount(account?: Partial<IconAccount>): IconAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "icon")!;

  const iconResources: IconResources = account?.iconResources || {
    nonce: 0,
    votingPower: BigNumber(0),
    totalDelegated: BigNumber(0),
  };

  const freshAddress = {
    address: "hx1234567890abcdef",
    derivationPath: "derivation_path",
  };

  const id = faker.string.uuid();
  const seedIdentifier = faker.string.uuid();
  const index = faker.number.int();

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
    iconResources,
  };
}

export function createFixtureTransaction(tx?: Partial<Transaction>): Transaction {
  return {
    amount: tx?.amount || new BigNumber(0),
    recipient: tx?.recipient || getAbandonSeedAddress("icon"),
    mode: tx?.mode || "send",
    family: "icon",
    fees: tx?.fees || undefined,
  };
}

export function createFixtureOperation(operation?: Partial<IconOperation>): IconOperation {
  return {
    id: operation?.id || faker.string.uuid(),
    hash: operation?.hash || faker.string.uuid(),
    type: operation?.type || "OUT",
    value: operation?.value || new BigNumber(faker.string.numeric()),
    fee: operation?.fee || new BigNumber(0),
    senders: operation?.senders || [],
    recipients: operation?.recipients || [],
    blockHeight: operation?.blockHeight || undefined,
    blockHash: operation?.blockHash || undefined,
    accountId: operation?.accountId || faker.string.uuid(),
    date: operation?.date || faker.date.past(),
    extra: {},
  };
}
