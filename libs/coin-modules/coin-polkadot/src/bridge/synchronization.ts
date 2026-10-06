import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { shouldRetainPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/pending";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { PolkadotContext } from "../config";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import polkadotAPI from "../network";
import { PolkadotAccount } from "../types";

export const makeGetAccountShape =
  (context: PolkadotContext): GetAccountShape<PolkadotAccount> =>
  async info => {
    await loadPolkadotCrypto();

    const { address, initialAccount, currency, derivationMode } = info;

    const assethubCurrency = getCryptoCurrencyById("assethub_polkadot");
    const assethubConfig = await context.config(assethubCurrency?.id);

    const shouldMigrate = currency.id === "polkadot" && assethubConfig.hasBeenMigrated;
    const currencyToUse = shouldMigrate ? assethubCurrency : currency;
    const config = await context.config(currencyToUse.id);

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
    } = await polkadotAPI.getAccount(context.logger, config, address, currencyToUse);

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currencyToUse.id,
      xpubOrAddress: address,
      derivationMode,
    });
    const oldOperations = initialAccount?.operations || [];
    const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
    const newOperations = await polkadotAPI.getOperations(
      context.logger,
      config,
      accountId,
      address,
      currencyToUse,
      startAt,
    );
    const operations = mergeOps(oldOperations, newOperations);

    return {
      id: accountId,
      balance,
      currency: currencyToUse,
      spendableBalance,
      operations: shouldMigrate ? [] : operations,
      operationsCount: shouldMigrate ? 0 : operations.length,
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
  };

/**
 * A send max (`balances.transferAll`) reaps the account, which resets its on-chain nonce to 0, so the
 * next extrinsics reuse nonces already present in the history. The framework's
 * `shouldRetainPendingOperation` compares a pending operation with the last confirmed one of the same
 * sender and would drop it right after broadcast.
 *
 * Pending operations are resolved here instead: dropped once their hash is indexed, and otherwise
 * only compared with confirmed operations that are not older than them.
 */
export const postSync = (initial: PolkadotAccount, synced: PolkadotAccount): PolkadotAccount => {
  const confirmedIds = new Set(synced.operations.map(o => o.id));

  return {
    ...synced,
    pendingOperations: initial.pendingOperations.filter(
      op =>
        !confirmedIds.has(op.id) &&
        shouldRetainPendingOperation(
          { ...synced, operations: synced.operations.filter(o => o.date >= op.date) },
          op,
        ),
    ),
  };
};

export const makeSyncBridge = (context: PolkadotContext) =>
  makeSync({ getAccountShape: makeGetAccountShape(context), postSync });
