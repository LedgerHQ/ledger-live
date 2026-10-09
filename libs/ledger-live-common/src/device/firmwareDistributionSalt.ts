import {
  isDummyUserId,
  userIdSelector,
  type IdentitiesState,
} from "@domain/entity-client-identity";

type IdentitiesStore = { getState(): { identities: IdentitiesState } };

let identitiesStore: IdentitiesStore | undefined;

/**
 * Register the store whose identities slice gives the user ID of the firmware distribution salt.
 * Should be called once during application initialization.
 */
export function setIdentitiesStore(store: IdentitiesStore): void {
  identitiesStore = store;
}

/**
 * User ID the firmware distribution salt is computed from, which selects the user's progressive OS
 * rollout. Empty until the store is set and identities are initialized.
 */
export function getFirmwareDistributionSaltUserId(): string {
  const userId = identitiesStore && userIdSelector(identitiesStore.getState());
  return userId && !isDummyUserId(userId) ? userId.exportUserIdForFirmwareSalt() : "";
}
