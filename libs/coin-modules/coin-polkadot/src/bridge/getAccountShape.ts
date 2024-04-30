import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import type { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";

export default async function getAccountShape(info: AccountShapeInfo) {
  await loadPolkadotCrypto();
  const { address, initialAccount, currency, derivationMode } = info;

  // Retrieve account info
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
  } = await polkadotAPI.getAccount(address);

  // Retrieve operations associated
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const newOperations = await polkadotAPI.getOperations(accountId, address, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    balance,
    spendableBalance,
    operations,
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
}
