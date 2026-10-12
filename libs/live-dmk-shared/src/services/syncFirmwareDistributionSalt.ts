import {
  isDummyUserId,
  userIdSelector,
  type IdentitiesState,
  type UserId,
} from "@domain/entity-client-identity";
import { UserHashService } from "./UserHashService";

type IdentitiesStore = {
  getState(): { identities: IdentitiesState };
  subscribe(listener: () => void): () => void;
};

/**
 * Keeps the DMK firmware distribution salt in sync with the user ID of the identities slice, whatever
 * the boot order: the ID stays the dummy one until the app restores identities, and the DMK can be
 * built before or after that.
 */
export function syncFirmwareDistributionSalt(
  store: IdentitiesStore,
  setFirmwareDistributionSalt: (salt: string) => void,
): () => void {
  let lastUserId: UserId | undefined;
  const sync = () => {
    const userId = userIdSelector(store.getState());
    if (isDummyUserId(userId) || lastUserId?.equals(userId)) return;
    lastUserId = userId;
    setFirmwareDistributionSalt(
      UserHashService.compute(userId.exportUserIdForFirmwareSalt()).firmwareSalt,
    );
  };
  sync();
  return store.subscribe(sync);
}
