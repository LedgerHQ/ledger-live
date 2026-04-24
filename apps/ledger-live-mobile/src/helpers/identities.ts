import { identitiesSlice, exportIdentitiesForPersistence } from "@ledgerhq/client-ids/store";
import type { PersistedIdentities } from "@ledgerhq/client-ids/store";
import type { Store } from "redux";
import { saveIdentities, deleteUser } from "../db";
import type { User } from "../types/store";
import type { State } from "../reducers/types";

type PersistedIdentitiesShape = PersistedIdentities | null | undefined;

/**
 * Initialize identities at boot: single source of truth after migration.
 */
export async function initIdentities(
  store: Store<State>,
  persistedIdentities: PersistedIdentitiesShape,
  legacyUser: User | null | undefined,
): Promise<void> {
  // 1. Legacy "user" exists: trust it, overwrite any userId/datadogId from persisted (avoids duplicates from previous initFromPersisted without userId)
  if (legacyUser?.id) {
    const merged: PersistedIdentities = {
      userId: legacyUser.id,
      datadogId: legacyUser.datadogId,
      deviceIds: Array.isArray(persistedIdentities?.deviceIds) ? persistedIdentities.deviceIds : [],
      pushDevicesSyncState: persistedIdentities?.pushDevicesSyncState ?? "synced",
      pushDevicesServiceUrl: persistedIdentities?.pushDevicesServiceUrl ?? null,
    };
    store.dispatch(identitiesSlice.actions.initFromPersisted(merged));
    const state = store.getState();
    await saveIdentities(exportIdentitiesForPersistence(state.identities));
    await deleteUser();
    return;
  }

  // 2. Persisted identities exist; initFromPersisted handles invalid/missing userId (generates new ids)
  if (persistedIdentities) {
    store.dispatch(
      identitiesSlice.actions.initFromPersisted({
        userId: persistedIdentities.userId,
        datadogId: persistedIdentities.datadogId,
        deviceIds: Array.isArray(persistedIdentities.deviceIds)
          ? persistedIdentities.deviceIds
          : [],
        pushDevicesSyncState: persistedIdentities.pushDevicesSyncState ?? "synced",
        pushDevicesServiceUrl: persistedIdentities.pushDevicesServiceUrl ?? null,
      }),
    );
    return;
  }

  // 3. Nothing to restore
  store.dispatch(identitiesSlice.actions.initFromScratch());
}
