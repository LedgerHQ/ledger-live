import storage from "LLM/storage";
import { identitiesSlice, PersistedIdentities } from "@ledgerhq/client-ids/store";
import type { StoreType } from "../context/store";

/**
 * Initialize identities from storage or migrate from legacy system
 * @returns true if a new user was created (initFromScratch), false otherwise
 */
export async function initIdentities(store: StoreType): Promise<boolean> {
  // Try to load persisted identities
  const persistedResult = await storage.get<PersistedIdentities>("identities");
  const persisted = Array.isArray(persistedResult) ? undefined : persistedResult;

  if (persisted) {
    // Restore from persisted data
    store.dispatch(identitiesSlice.actions.initFromPersisted(persisted));
    return false;
  }

  // No persisted data, try to migrate from legacy system
  const legacyUserResult = await storage.get<{ id?: string; datadogId?: string }>("user");
  const legacyUser = Array.isArray(legacyUserResult) ? undefined : legacyUserResult;
  if (legacyUser?.id) {
    // Migrate from legacy format
    store.dispatch(
      identitiesSlice.actions.importFromLegacy({
        userId: legacyUser.id,
        datadogId: legacyUser.datadogId,
      }),
    );
    // Persistence will be handled by db middleware
    return false;
  }

  // No legacy data, initialize from scratch
  store.dispatch(identitiesSlice.actions.initFromScratch());
  return true;
}
