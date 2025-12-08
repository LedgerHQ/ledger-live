import { createSelector } from "reselect";
import { State } from ".";
import { UserId } from "@ledgerhq/identities";

/**
 * Selector to get userId from identities state
 * Returns null if userId is not initialized
 *
 * When using the userId, call the appropriate export method based on the use case:
 * - exportUserIdForPushDevicesService() - for API calls to Push Devices Service
 * - exportUserIdForPersistence() - for persistence/storage
 */
export const userIdSelector = createSelector(
  (state: State) => state.identities.userId,
  (userId): UserId | null => userId,
);
