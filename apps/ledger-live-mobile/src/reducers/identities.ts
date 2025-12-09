import { createSelector } from "reselect";
import { State } from ".";
import { UserId, DatadogId } from "@ledgerhq/identities";

/**
 * Selector to get userId from identities state
 * Always returns a UserId (may be a dummy value before initialization)
 *
 * When using the userId, call the appropriate export method based on the use case:
 * - exportUserIdForPushDevicesService() - for API calls to Push Devices Service
 * - exportUserIdForPersistence() - for persistence/storage
 * - exportUserIdForSegment() - for Segment analytics
 * - exportUserIdForDisplay() - for UI display
 * - exportUserIdForWalletAPI() - for Wallet API
 * - exportUserIdForBraze() - for Braze analytics
 * - etc.
 */
export const userIdSelector = createSelector(
  (state: State) => state.identities.userId,
  (userId): UserId => userId,
);

/**
 * Selector to get datadogId from identities state
 * Always returns a DatadogId (may be a dummy value before initialization)
 */
export const datadogIdSelector = createSelector(
  (state: State) => state.identities.datadogId,
  (datadogId): DatadogId => datadogId,
);
