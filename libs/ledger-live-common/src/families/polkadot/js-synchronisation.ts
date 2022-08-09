import type { Account } from "@ledgerhq/types-live";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";
import { loadPolkadotCrypto } from "./polkadot-crypto";

const getAccountShape: GetAccountShape = async (info) => {
  await loadPolkadotCrypto();
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length
    ? (oldOperations[0].blockHeight || 0) + 1
    : 0;
  const {
    blockHeight,
    balance,
    spendableBalance,
    nonce,
    lockedBalance,
    controller,
    stash,
    unlockedBalance,
    unlockingBalance,
    unlockings,
    nominations,
    numSlashingSpans,
  } = await getAccount(address);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const newOperations = await getOperations(accountId, address, startAt);
  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    polkadotResources: {
      nonce,
      controller,
      stash,
      lockedBalance,
      unlockedBalance,
      unlockingBalance,
      unlockings,
      nominations,
      numSlashingSpans,
    },
  };
  return { ...shape, operations } as Partial<Account>;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
