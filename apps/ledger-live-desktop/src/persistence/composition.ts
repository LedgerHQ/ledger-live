import {
  createPersistence,
  describePersistenceFailure,
  isWritableStatus,
  selectRecordStatus,
  type HydrationStatuses,
  type PersistenceBinding,
  type PersistenceFailure,
  type WriteStrategy,
} from "@features/platform-persistence";
import { createElectronStorage } from "@shared/storage-electron";
import { db } from "~/renderer/bridge";
import logger from "~/renderer/logger";
import type { State } from "~/renderer/reducers";
import { importWalletState } from "~/renderer/reducers/wallet";
import { getKey, SET_KEY_DEBOUNCE_MS } from "~/renderer/storage";
import type { AppDispatch, ReduxStore } from "~/state-manager/configureStore";
import { accountsRecord } from "./records/accounts";
import { historyRecord } from "./records/history";

/** The renderer debounce of the legacy `setKey`. */
const LEGACY_WRITE_STRATEGY: WriteStrategy = { debounceMs: SET_KEY_DEBOUNCE_MS };

const BINDINGS: ReadonlyArray<PersistenceBinding<State>> = [
  { record: historyRecord, strategy: LEGACY_WRITE_STRATEGY },
  { record: accountsRecord, strategy: LEGACY_WRITE_STRATEGY },
];

/** The keys that main encrypts with the password: they read as `locked` until the unlock. */
const ENCRYPTED_KEYS = [accountsRecord.key];

class PersistenceFailureError extends Error {
  override name = "PersistenceFailureError";
  constructor(failure: PersistenceFailure) {
    super(describePersistenceFailure(failure));
  }
}

/** A newer version comes back after a downgrade: expected, so a warning, not an error. */
function report(failure: PersistenceFailure) {
  if (failure.operation === "newer") logger.warn(describePersistenceFailure(failure));
  else logger.critical(new PersistenceFailureError(failure), "persistence");
}

export const persistence = createPersistence<State>({
  storage: createElectronStorage({ bridge: db, encryptedKeys: ENCRYPTED_KEYS }),
  bindings: BINDINGS,
  report,
});

class AccountsUnreadableError extends Error {
  override name = "AccountsUnreadableError";
}

class EncryptedRecordsStillLockedError extends Error {
  override name = "EncryptedRecordsStillLockedError";
}

/**
 * Hydrates, then imports the `app.wallet` state, as `fetchAccounts` did: its account names win
 * over the copy in each account (LIVE-41517). `wallet` is not a persistence record yet, and it is
 * read first, so a write of the hydrated names cannot reach it before the read. A failed accounts
 * record stops here, as an unreadable `app.accounts` does today.
 */
async function hydrateWithWallet(
  store: ReduxStore,
  keys?: ReadonlyArray<string>,
): Promise<HydrationStatuses> {
  const wallet = await getKey("app", "wallet");
  const statuses = await persistence.hydrate(store, { keys });
  if (statuses.accounts === "failed") throw new AccountsUnreadableError();
  if (isWritableStatus(statuses.accounts) && wallet?.walletSyncState) {
    const dispatch: AppDispatch = store.dispatch;
    dispatch(importWalletState(wallet));
  }
  return statuses;
}

/** At start. `accounts` is `locked` while the app has a password: the app then shows the lock. */
export const hydrateAtStart = (store: ReduxStore) => hydrateWithWallet(store);

/** True once the encrypted records are in the state: a later unlock does not read them again. */
export const encryptedRecordsLoaded = (state: State): boolean =>
  ENCRYPTED_KEYS.every(key => isWritableStatus(selectRecordStatus(state, key)));

/** After the password unlock. It throws while a record is still encrypted (wrong password). */
export async function hydrateEncryptedRecords(store: ReduxStore): Promise<void> {
  const statuses = await hydrateWithWallet(store, ENCRYPTED_KEYS);
  const stillLocked = ENCRYPTED_KEYS.filter(key => statuses[key] === "locked");
  if (stillLocked.length > 0) throw new EncryptedRecordsStillLockedError(stillLocked.join(", "));
}
