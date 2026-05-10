import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";
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

  const id = "icon:fixture-account";
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
    id: operation?.id || "icon:fixture-op",
    hash: operation?.hash || "0x" + "0".repeat(64),
    type: operation?.type || "OUT",
    value: operation?.value || new BigNumber(0),
    fee: operation?.fee || new BigNumber(0),
    senders: operation?.senders || [],
    recipients: operation?.recipients || [],
    blockHeight: operation?.blockHeight || undefined,
    blockHash: operation?.blockHash || undefined,
    accountId: operation?.accountId || "icon:fixture-account",
    date: operation?.date || new Date("2024-01-01"),
    extra: {},
  };
}
