// @flow

import { Observable, from, defer } from "rxjs";
import { map } from "rxjs/operators";
import { SyncError } from "@ledgerhq/errors";
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { withLibcore } from "./access";
import { buildAccount } from "./buildAccount";
import { getCoreAccount } from "./getCoreAccount";
import { remapLibcoreErrors } from "./errors";
import { shouldRetainPendingOperation } from "../account";
import postSyncPatchPerFamily from "../generated/libcore-postSyncPatch";

// FIXME how to get that
const OperationOrderKey = {
  date: 0
};

export async function syncCoreAccount({
  core,
  coreWallet,
  coreAccount,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingAccount
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingAccount?: ?Account
}): Promise<Account> {
  let coreOperations;
  try {
    const eventReceiver = await core.EventReceiver.newInstance();
    const eventBus = await coreAccount.synchronize();
    const serialContext = await core
      .getThreadDispatcher()
      .getMainExecutionContext();

    await eventBus.subscribe(serialContext, eventReceiver);

    const query = await coreAccount.queryOperations();
    const completedQuery = await query.complete();
    const sortedQuery = await completedQuery.addOrder(
      OperationOrderKey.date,
      false
    );
    coreOperations = await sortedQuery.execute();
  } catch (e) {
    if (e.name !== "Error") throw remapLibcoreErrors(e);
    throw new SyncError(e.message);
  }

  const account = await buildAccount({
    coreWallet,
    coreAccount,
    coreOperations,
    currency,
    accountIndex,
    derivationMode,
    seedIdentifier,
    existingAccount
  });

  return account;
}

const defaultPostSyncPatch = (initial: Account, synced: Account): Account =>
  synced;

export function syncAccount(
  existingAccount: Account
): Observable<(Account) => Account> {
  const { derivationMode, seedIdentifier, currency } = existingAccount;
  const postSyncPatch =
    postSyncPatchPerFamily[currency.family] || defaultPostSyncPatch;
  return defer(() =>
    from(
      withLibcore(core =>
        getCoreAccount(core, existingAccount).then(
          ({ coreWallet, coreAccount, walletName }) =>
            syncCoreAccount({
              core,
              coreWallet,
              coreAccount,
              walletName,
              currency,
              accountIndex: existingAccount.index,
              derivationMode,
              seedIdentifier,
              existingAccount
            })
        )
      )
    )
  ).pipe(
    map(syncedAccount => initialAccount =>
      postSyncPatch(initialAccount, {
        ...initialAccount,
        id: syncedAccount.id,
        freshAddress: syncedAccount.freshAddress,
        freshAddressPath: syncedAccount.freshAddressPath,
        balance: syncedAccount.balance,
        spendableBalance: syncedAccount.spendableBalance,
        blockHeight: syncedAccount.blockHeight,
        lastSyncDate: new Date(),
        operations: syncedAccount.operations,
        subAccounts: syncedAccount.subAccounts,
        pendingOperations: initialAccount.pendingOperations.filter(op =>
          shouldRetainPendingOperation(syncedAccount, op)
        )
      })
    )
  );
}
