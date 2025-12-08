import storage from "LLM/storage";
import { identitiesSlice, PersistedIdentities } from "@ledgerhq/identities";
import { getUser } from "../db";
import type { AppStore } from "../reducers";

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
    try {
      // FIXME this is the only legitimate usage of getUser() - for migration from legacy storage
      // Once migration period is over, this can be removed
      const legacyUser = await getUser();
      if (legacyUser?.id) {
        // Migrate from legacy format
        store.dispatch(
          identitiesSlice.actions.importFromLegacy({
            userId: legacyUser.id,
            datadogId: legacyUser.datadogId,
          }),
        );
        // Persistence will be handled by db middleware
        return;
      }
    } catch {
      // Legacy system not available, continue to init from scratch
    }

    // No legacy data, initialize from scratch
    store.dispatch(identitiesSlice.actions.initFromScratch());
    // Persistence will be handled by db middleware
  } catch {
    // If anything fails, initialize from scratch
    store.dispatch(identitiesSlice.actions.initFromScratch());
  }
}
