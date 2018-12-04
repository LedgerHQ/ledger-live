// @flow

import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";
import { getWalletName } from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  Operation,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { SyncError } from "../errors";
import { withLibcore } from "./access";
import { createInstance } from "./specific";
import { buildAccount } from "./buildAccount";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import { remapLibcoreErrors } from "./errors";

// FIXME how to get that
const OperationOrderKey = {
  date: 0,
};

async function getCoreObjects(core, account: Account) {
  const walletName = getWalletName(account);
  const { currency, derivationMode, index, xpub } = account;

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

  return { coreWallet, coreAccount, walletName };
}

export function syncAccount(
  account: Account,
): Observable<(Account) => Account> {
  const {
    derivationMode,
    seedIdentifier,
    currency,
    operations: existingOperations,
  } = account;
  return from(
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
            existingOperations,
          }),
      ),
    ),
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
      pendingOperations: [],
    })),
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
  existingOperations,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingOperations: Operation[],
}): Promise<Account> {
  let coreOperations;
  try {
    const eventReceiver = await createInstance(core.coreEventReceiver);
    const eventBus = await core.coreAccount.synchronize(coreAccount);
    const serialContext = await core.coreThreadDispatcher.getMainExecutionContext(
      core.getThreadDispatcher(),
    );

    await core.coreEventBus.subscribe(eventBus, serialContext, eventReceiver);

    const query = await core.coreAccount.queryOperations(coreAccount);
    const completedQuery = await core.coreOperationQuery.complete(query);
    const sortedQuery = await core.coreOperationQuery.addOrder(
      completedQuery,
      OperationOrderKey.date,
      false,
    );
    coreOperations = await core.coreOperationQuery.execute(sortedQuery);
  } catch (e) {
    throw remapLibcoreErrors(e, new SyncError(e));
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
    existingOperations,
  });

  return account;
}
