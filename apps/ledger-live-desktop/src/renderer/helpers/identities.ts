import { getKey } from "~/renderer/storage";
import { identitiesSlice, PersistedIdentities } from "@ledgerhq/identities";
import { getUserId } from "~/helpers/user";
import type { ReduxStore } from "~/renderer/createStore";

/**
 * Initialize identities from storage or migrate from legacy system
 */
export async function initIdentities(store: ReduxStore) {
  try {
    // Try to load persisted identities
    const persisted = await getKey<PersistedIdentities>("app", "identities");

    if (persisted) {
      // Restore from persisted data
      store.dispatch(identitiesSlice.actions.initFromPersisted(persisted));
      return;
    }

    // No persisted data, try to migrate from legacy system
    try {
      // FIXME this is the only legitimate usage of getUserId() - for migration from localStorage
      // Once migration period is over, this can be removed
      const legacyUserId = getUserId();
      if (legacyUserId) {
        // Migrate from legacy format
        store.dispatch(
          identitiesSlice.actions.importFromLegacy({
            userId: legacyUserId,
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
