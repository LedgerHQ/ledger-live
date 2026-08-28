import {
  ACCESSIBLE,
  STORAGE_TYPE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
  type SetOptions,
} from "react-native-keychain";
import type { CardSessionStore } from "./sessionStore";

/**
 * The library stores a username and a password together, and the session key has to go somewhere.
 * `service` is the only per-entry namespace it offers, so the key goes there and each key becomes
 * its own entry. The app password uses the default bundle-ID slot (see `AuthPass`), which a named
 * entry never touches.
 *
 * The username is therefore a constant the store never reads back. Only the password carries a
 * value.
 */
const KEYCHAIN_USERNAME = "payCard";

/**
 * `AFTER_FIRST_UNLOCK` is the weakest level that still protects the user. The session must be
 * readable while the screen is locked, because a Card request can run from a background launch, but
 * it stays unreadable until the user unlocks the device once after boot.
 *
 * `AES_GCM_NO_AUTH` is the Android half of the same rule. The library otherwise picks the best
 * storage it can find, and the authenticated variant asks for a biometric prompt that a background
 * read cannot answer.
 */
const writeOptions: SetOptions = {
  accessible: ACCESSIBLE.AFTER_FIRST_UNLOCK,
  storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
};

export const secureStore: CardSessionStore = {
  async read(key) {
    // `false` is an empty slot. A read the OS refused rejects, and the rejection travels: a locked
    // or unreadable keychain must never pass for an absent session, because an absent session ends
    // one. The base query reports the failure, and the renewal keeps the session and tries again.
    const entry = await getGenericPassword({ service: key });
    return entry ? entry.password : null;
  },
  async write(key, value) {
    const stored = await setGenericPassword(KEYCHAIN_USERNAME, value, {
      ...writeOptions,
      service: key,
    });
    // A refused write answers `false` instead of rejecting. `createCardSession` finds a partial
    // write through rejections alone, so a `false` that passed as success would leave the refresh
    // token on disk with no session to spend it.
    if (!stored) {
      throw new Error(`The keychain refused to store ${key}`);
    }
  },
  async remove(key) {
    // Removal stays best effort, and `false` cannot separate "the store refused" from "there was
    // nothing there". `createCardSession` raises its cleared flag before the first removal, so the
    // session is dead either way.
    await resetGenericPassword({ service: key });
  },
};
