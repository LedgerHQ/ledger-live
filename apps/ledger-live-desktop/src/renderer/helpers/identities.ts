import { getKey } from "~/renderer/storage";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import type { ReduxStore } from "~/renderer/createStore";

/**
 * Initialize identities from storage or migrate from legacy system
 * @returns true if a new user was created (initFromScratch), false otherwise
 */
export async function initIdentities(store: ReduxStore): Promise<boolean> {
  // Try to load persisted identities
  const persisted = await getKey("app", "identities");

  if (persisted) {
    // Restore from persisted data
    store.dispatch(identitiesSlice.actions.initFromPersisted(persisted));
    return false;
  }

  // No persisted data, try to migrate from legacy storage (db.user)
  const legacyUser = await getKey("app", "user");
  if (legacyUser?.id) {
    // Migrate from legacy format
    store.dispatch(
      identitiesSlice.actions.importFromLegacy({
        userId: legacyUser.id,
      }),
    );
    // Persistence will be handled by db middleware
    return false;
  }

  // Fallback: try localStorage (for backwards compatibility)
  if (typeof window === "object") {
    const { localStorage } = window;
    const legacyUserId = localStorage.getItem("userId");
    if (legacyUserId) {
      // Migrate from legacy format
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: legacyUserId,
        }),
      );
      // Persistence will be handled by db middleware
      return false;
    }
  }

  // No legacy data, initialize from scratch
  store.dispatch(identitiesSlice.actions.initFromScratch());
  // Persistence will be handled by db middleware
  return true;
}
