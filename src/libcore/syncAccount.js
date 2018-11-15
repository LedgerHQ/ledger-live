// @flow

import { Observable, from } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { getWalletName } from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { SyncError } from "../errors";
import load from "./load";
import { createInstance } from "./specific";
import { buildAccount } from "./buildAccount";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";

function operationsDiffer(a, b) {
  if ((a && !b) || (b && !a)) return true;
  return (
    a.hash !== b.hash ||
    !a.value.isEqualTo(b.value) ||
    a.blockHeight !== b.blockHeight
  );
}

async function getCoreObjects(account: Account) {
  const walletName = getWalletName(account);
  const { currency, derivationMode, index, xpub } = account;

  const core = await load();

  const coreWallet = await getOrCreateWallet({
    core,
    walletName,
    currency,
    derivationMode,
  });

  const coreAccount = await getOrCreateAccount({
    core,
    coreWallet,
    index,
    xpub,
  });

  return { core, coreWallet, coreAccount, walletName };
}

export function syncAccount(
  account: Account,
): Observable<(Account) => Account> {
  const { derivationMode, seedIdentifier, currency } = account;
  return from(getCoreObjects(account)).pipe(
    mergeMap(({ core, coreWallet, coreAccount, walletName }) =>
      from(
        syncCoreAccount({
          core,
          coreWallet,
          coreAccount,
          walletName,
          currency,
          accountIndex: account.index,
          derivationMode,
          seedIdentifier,
        }),
      ).pipe(
        map(syncedAccount => initialAccount => {
          const patch = {
            ...initialAccount,
            id: syncedAccount.id,
            freshAddress: syncedAccount.freshAddress,
            freshAddressPath: syncedAccount.freshAddressPath,
            balance: syncedAccount.balance,
            blockHeight: syncedAccount.blockHeight,
            lastSyncDate: new Date(),
            operations: initialAccount.operations,
            pendingOperations: [],
          };

          const oldOpsLength = initialAccount.operations.length;
          const newOpsLength = syncedAccount.operations.length;

          const patchedOperations = [];
          let hasChanged = false;

          for (let i = 0; i < newOpsLength; i++) {
            const newOp = syncedAccount.operations[newOpsLength - 1 - i];
            const oldOp = initialAccount.operations[oldOpsLength - 1 - i];
            if (operationsDiffer(newOp, oldOp)) {
              hasChanged = true;
              patchedOperations.push(newOp);
            } else {
              patchedOperations.push(oldOp);
            }
          }

          if (hasChanged) {
            patch.operations = patchedOperations;
          }

          return patch;
        }),
      ),
    ),
  );
}

export async function syncCoreAccount({
  core,
  coreWallet,
  coreAccount,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
}): Promise<Account> {
  const eventReceiver = await createInstance(core.coreEventReceiver);
  const eventBus = await core.coreAccount.synchronize(coreAccount);
  const serialContext = await core.coreThreadDispatcher.getMainExecutionContext(
    core.getThreadDispatcher(),
  );
  await core.coreEventBus.subscribe(eventBus, serialContext, eventReceiver);

  let query;
  let completedQuery;
  let coreOperations;

  try {
    query = await core.coreAccount.queryOperations(coreAccount);
    completedQuery = await core.coreOperationQuery.complete(query);
    coreOperations = await core.coreOperationQuery.execute(completedQuery);
  } catch (e) {
    throw new SyncError(e.message); // todo more precision needed
  }

  const account = await buildAccount({
    core,
    coreWallet,
    coreAccount,
    coreOperations,
    currency,
    accountIndex,
    derivationMode,
    seedIdentifier,
  });

  await core.flush();

  return account;
}
