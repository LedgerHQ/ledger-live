import { getKey } from "~/renderer/storage";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import type { ReduxStore } from "~/state-manager/configureStore";

type LegacyUser = { id: string; datadogId?: string } | null;

type PersistedIdentitiesShape = {
  userId?: string;
  datadogId?: string;
  deviceIds?: string[];
  pushDevicesSyncState?: "synced" | "unsynced";
  pushDevicesServiceUrl?: string | null;
};

/**
 * Initialize identities: prefer app.identities, then legacy app.user / localStorage userId, else initFromScratch.
 * Same legacy fallback order as previous user.ts (app.user then localStorage).
 * @returns true only when initFromScratch ran (no persisted, no legacy); false otherwise.
 */
export async function initIdentities(store: ReduxStore): Promise<boolean> {
  const persisted = (await getKey("app", "identities")) as PersistedIdentitiesShape | undefined;

  if (persisted) {
    store.dispatch(
      identitiesSlice.actions.initFromPersisted({
        userId: persisted.userId,
        datadogId: persisted.datadogId,
        deviceIds: Array.isArray(persisted.deviceIds) ? persisted.deviceIds : [],
        pushDevicesSyncState: persisted.pushDevicesSyncState ?? "synced",
        pushDevicesServiceUrl: persisted.pushDevicesServiceUrl ?? null,
      }),
    );
    return false;
  }

  const legacyUser = (await getKey("app", "user")) as LegacyUser;
  if (legacyUser?.id) {
    store.dispatch(
      identitiesSlice.actions.importFromLegacy({
        userId: legacyUser.id,
        datadogId: legacyUser.datadogId,
      }),
    );
    return false;
  }

  if (typeof localStorage !== "undefined") {
    const legacyUserId = localStorage.getItem("userId");
    if (legacyUserId) {
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: legacyUserId,
        }),
      );
      return false;
    }
  }

  store.dispatch(identitiesSlice.actions.initFromScratch());
  return true;
}
