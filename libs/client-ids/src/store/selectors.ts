import { IdentitiesState } from "./types";

/**
 * Selector to get userId from identities state.
 * Always returns a non-null UserId (may be a dummy if not initialized).
 */
export const userIdSelector = (state: { identities: IdentitiesState }) => state.identities.userId;

/**
 * Selector to get datadogId from identities state.
 * Always returns a non-null DatadogId (may be a dummy if not initialized).
 */
export const datadogIdSelector = (state: { identities: IdentitiesState }) =>
  state.identities.datadogId;
