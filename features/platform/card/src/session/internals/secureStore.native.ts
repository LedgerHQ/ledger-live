import * as SecureStore from "expo-secure-store";
import type { CardSessionStore } from "./sessionStore";

/**
 * `AFTER_FIRST_UNLOCK` is the weakest level that still protects the user. The session must be
 * readable while the screen is locked, because a Card request can run from a background launch, but
 * it stays unreadable until the user unlocks the device once after boot.
 */
const writeOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const secureStore: CardSessionStore = {
  async read(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // A value the OS can no longer decrypt reads as absent. It must never reject a Card request.
      return null;
    }
  },
  write(key, value) {
    return SecureStore.setItemAsync(key, value, writeOptions);
  },
  remove(key) {
    return SecureStore.deleteItemAsync(key);
  },
};
