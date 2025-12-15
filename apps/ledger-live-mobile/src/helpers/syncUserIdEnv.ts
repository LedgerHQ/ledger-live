import { Store } from "redux";
import { userIdSelector, isDummyUserId } from "@ledgerhq/client-ids/store";
import { getUserHashes } from "@ledgerhq/live-common/user";
import { setEnv } from "@ledgerhq/live-env";
import type { State } from "~/reducers/types";

/**
 * Sync FIRMWARE_SALT env var from identities store
 * This should be called after identities are initialized
 */
export function syncUserIdEnv(store: Store<State>) {
  const state = store.getState();
  const userId = userIdSelector(state);

  if (!isDummyUserId(userId)) {
    const userIdString = userId.exportUserIdForFirmwareSaltHash();
    const firmwareSalt = getUserHashes(userIdString).firmwareSalt;
    setEnv("FIRMWARE_SALT", firmwareSalt);
  }
}

/**
 * Subscribe to store changes and sync FIRMWARE_SALT env var
 */
export function subscribeToUserIdChanges(store: Store<State>) {
  let lastUserIdString: string | null = null;

  store.subscribe(() => {
    const state = store.getState();
    const userId = userIdSelector(state);

    if (!isDummyUserId(userId)) {
      const userIdString = userId.exportUserIdForFirmwareSaltHash();
      if (userIdString !== lastUserIdString) {
        lastUserIdString = userIdString;
        const firmwareSalt = getUserHashes(userIdString).firmwareSalt;
        setEnv("FIRMWARE_SALT", firmwareSalt);
      }
    }
  });
}
