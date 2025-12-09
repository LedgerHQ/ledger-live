import { getKey } from "~/renderer/storage";
import { identitiesSlice, PersistedIdentities } from "@ledgerhq/identities";
import { v4 as uuid } from "uuid";
import type { ReduxStore } from "~/renderer/createStore";

/**
 * Private function to load legacy userId from localStorage
 * This is only used during migration and should not be called elsewhere
 */
function loadLegacyUserIdFromLocalStorage(): string | null {
  if (typeof window === "object") {
    const { localStorage } = window;
    return localStorage.getItem("userId");
  }
  return null;
}

/**
 * Private function to load legacy user from app storage
 * This is only used during migration and should not be called elsewhere
 */
async function loadLegacyUserFromStorage(): Promise<{ id: string } | null> {
  try {
    const user = await getKey("app", "user");
    if (user && typeof user === "object" && "id" in user && typeof user.id === "string") {
      return user as { id: string };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialize identities from storage or migrate from legacy system
 */
export async function initIdentities(store: ReduxStore) {
  try {
    // Try to load persisted identities
    const persisted = await getKey("app", "identities");
    if (persisted && typeof persisted === "object" && "userId" in persisted) {
      // Restore from persisted data
      store.dispatch(identitiesSlice.actions.initFromPersisted(persisted as PersistedIdentities));
      return;
    }

    // No persisted data, try to migrate from legacy system
    // Try localStorage first (oldest format)
    const legacyUserId = loadLegacyUserIdFromLocalStorage();
    if (legacyUserId) {
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: legacyUserId,
        }),
      );
      return;
    }

    // Try app storage (intermediate format)
    const legacyUser = await loadLegacyUserFromStorage();
    if (legacyUser?.id) {
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: legacyUser.id,
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
