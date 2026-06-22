import { getKey } from "~/renderer/storage";
import { identitiesSlice, shouldUsePersistedId } from "@ledgerhq/client-ids/store";
import type { ReduxStore } from "~/state-manager/configureStore";

type LegacyUser = { id: string; datadogId?: string } | null;

type LegacyIds = { userId: string; datadogId?: string };

type PersistedIdentitiesShape = {
  userId?: string;
  datadogId?: string;
  deviceIds?: string[];
  pushDevicesSyncState?: "synced" | "unsynced";
  pushDevicesServiceUrl?: string | null;
};

async function readLegacyIds(): Promise<LegacyIds | null> {
  const legacyUser = (await getKey("app", "user")) as LegacyUser;
  if (legacyUser && shouldUsePersistedId(legacyUser.id)) {
    const datadogId = legacyUser.datadogId;
    return {
      userId: legacyUser.id,
      datadogId: shouldUsePersistedId(datadogId) ? datadogId : undefined,
    };
  }
  if (typeof localStorage !== "undefined") {
    const legacyUserId = localStorage.getItem("userId") ?? undefined;
    if (shouldUsePersistedId(legacyUserId)) {
      return { userId: legacyUserId };
    }
  }
  return null;
}

/**
 * Initialize identities: prefer app.identities, then legacy app.user / localStorage userId, else initFromScratch.
 * app.identities may exist from the deviceId rollout with deviceIds only (no userId): we still recover the
 * legacy userId in that case, otherwise returning users get a new id and appear as new in analytics.
 * @returns true only when initFromScratch ran (no persisted, no legacy); false otherwise.
 */
export async function initIdentities(store: ReduxStore): Promise<boolean> {
  const persisted = (await getKey("app", "identities")) as PersistedIdentitiesShape | undefined;

  if (persisted) {
    let userId = persisted.userId;
    let datadogId = persisted.datadogId;
    if (!shouldUsePersistedId(userId) || !shouldUsePersistedId(datadogId)) {
      const legacy = await readLegacyIds();
      if (legacy) {
        if (!shouldUsePersistedId(userId)) {
          userId = legacy.userId;
        }
        if (!shouldUsePersistedId(datadogId)) {
          datadogId = legacy.datadogId;
        }
      }
    }
    store.dispatch(
      identitiesSlice.actions.initFromPersisted({
        userId,
        datadogId,
        deviceIds: Array.isArray(persisted.deviceIds) ? persisted.deviceIds : [],
        pushDevicesSyncState: persisted.pushDevicesSyncState ?? "synced",
        pushDevicesServiceUrl: persisted.pushDevicesServiceUrl ?? null,
      }),
    );
    return false;
  }

  const legacy = await readLegacyIds();
  if (legacy) {
    store.dispatch(identitiesSlice.actions.importFromLegacy(legacy));
    return false;
  }

  store.dispatch(identitiesSlice.actions.initFromScratch());
  return true;
}
