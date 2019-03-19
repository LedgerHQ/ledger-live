// @flow

import { Observable, from, defer } from "rxjs";
import { map } from "rxjs/operators";
import { getWalletName } from "../account";
import type {
  Account,
  Operation,
  CryptoCurrency,
  DerivationMode
} from "../types";
import { SyncError } from "../errors";
import { withLibcore } from "./access";
import { buildAccount } from "./buildAccount";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import { remapLibcoreErrors } from "./errors";

// FIXME how to get that
const OperationOrderKey = {
  date: 0
};

async function getCoreObjects(core, account: Account) {
  const walletName = getWalletName(account);
  const { currency, derivationMode, index, xpub } = account;

  const coreWallet = await getOrCreateWallet({
    core,
    walletName,
    currency,
    derivationMode
  });

  const coreAccount = await getOrCreateAccount({
    core,
    coreWallet,
    index,
    xpub
  });

  return { coreWallet, coreAccount, walletName };
}

export function syncAccount(
  account: Account
): Observable<(Account) => Account> {
  const {
    derivationMode,
    seedIdentifier,
    currency,
    operations: existingOperations
  } = account;
  return defer(() =>
    from(
      withLibcore(core =>
        getCoreObjects(core, account).then(
          ({ coreWallet, coreAccount, walletName }) =>
            syncCoreAccount({
              core,
              coreWallet,
              coreAccount,
              walletName,
              currency,
              accountIndex: account.index,
              derivationMode,
              seedIdentifier,
              existingOperations
            })
        )
      )
    )
  ).pipe(
    map(syncedAccount => initialAccount => ({
      ...initialAccount,
      id: syncedAccount.id,
      freshAddress: syncedAccount.freshAddress,
      freshAddressPath: syncedAccount.freshAddressPath,
      balance: syncedAccount.balance,
      blockHeight: syncedAccount.blockHeight,
      lastSyncDate: new Date(),
      operations: syncedAccount.operations,
      pendingOperations: []
    }))
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
  existingOperations
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingOperations: Operation[]
}): Promise<Account> {
  let coreOperations;
  try {
    // TODO integrating desktop code back in to handle events!
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
    throw remapLibcoreErrors(new SyncError(e.message));
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
    existingOperations
  });

  return account;
}
