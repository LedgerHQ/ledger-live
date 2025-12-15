import { IdentitiesState } from "./types";

/**
 * Selector to get userId from identities state
 * Always returns a non-null UserId (may be a dummy object if not initialized)
 * Always use this selector and then call an explicit export method (e.g., exportUserIdForSegment())
 */
export const userIdSelector = (state: { identities: IdentitiesState }) => state.identities.userId;

/**
 * Selector to get datadogId from identities state
 * Always returns a non-null DatadogId (may be a dummy object if not initialized)
 * Always use this selector and then call an explicit export method (e.g., exportDatadogIdForAnalytics())
 */
export const datadogIdSelector = (state: { identities: IdentitiesState }) =>
  state.identities.datadogId;
