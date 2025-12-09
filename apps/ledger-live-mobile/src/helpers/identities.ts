import storage from "LLM/storage";
import { identitiesSlice, PersistedIdentities } from "@ledgerhq/identities";
import type { AppStore } from "../reducers";
import type { User } from "../types/store";

/**
 * Private function to load legacy user from storage
 * This is only used during migration and should not be called elsewhere
 */
async function loadLegacyUserFromStorage(): Promise<User | null> {
  try {
    return (await storage.get("user")) as User | null;
  } catch {
    return null;
  }
}

/**
 * Initialize identities from storage or migrate from legacy system
 */
export async function initIdentities(store: AppStore) {
  try {
    // Try to load persisted identities
    const persisted = await storage.get<PersistedIdentities>("identities");

    if (persisted) {
      // Restore from persisted data
      store.dispatch(identitiesSlice.actions.initFromPersisted(persisted));
      return;
    }

    // No persisted data, try to migrate from legacy system
    const legacyUser = await loadLegacyUserFromStorage();
    if (legacyUser?.id) {
      // Migrate from legacy format
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: legacyUser.id,
          datadogId: legacyUser.datadogId,
        }),
      );
      return;
    }

    // No legacy data, initialize from scratch
    store.dispatch(identitiesSlice.actions.initFromScratch());
  } catch {
    // If anything fails, initialize from scratch
    store.dispatch(identitiesSlice.actions.initFromScratch());
  }
}
