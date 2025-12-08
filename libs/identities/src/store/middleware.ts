import { Middleware } from "@reduxjs/toolkit";
import { IdentitiesState } from "./types";
import { identitiesSlice } from "./slice";
import { pushDevicesApi, createPushDevicesRequest } from "../api/api";

/**
 * Configuration for the sync middleware
 */
export interface SyncMiddlewareConfig<State = unknown> {
  /**
   * Function to get the current state
   */
  getState: () => State;

  /**
   * Function to dispatch actions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => any;

  /**
   * Selector to get identities state from the global state
   */
  getIdentitiesState: (state: State) => IdentitiesState;

  /**
   * Selector to get analytics consent from the global state
   * This avoids duplicating analytics consent in the identities state
   */
  getAnalyticsConsent: (state: State) => boolean;
}

/**
 * Check if identities state needs to be synced
 */
function shouldSync<State>(state: State, config: SyncMiddlewareConfig<State>): boolean {
  const identitiesState = config.getIdentitiesState(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  if (!identitiesState.userId) {
    return false;
  }

  if (!analyticsConsent) {
    return false;
  }

  if (identitiesState.deviceIds.length === 0) {
    return false;
  }

  return identitiesState.pushDevicesSyncState === "unsynced";
}

/**
 * Attempt to sync devices to the backend
 * RTK Query handles retries automatically via baseQuery retry configuration
 */
async function attemptSync<State>(
  state: State,
  config: SyncMiddlewareConfig<State>,
): Promise<void> {
  const identitiesState = config.getIdentitiesState(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  if (!identitiesState.userId || !analyticsConsent || identitiesState.deviceIds.length === 0) {
    return;
  }

  const request = createPushDevicesRequest(identitiesState.userId, identitiesState.deviceIds);
  const result = await config.dispatch(pushDevicesApi.endpoints.pushDevices.initiate(request));

  if (result && typeof result === "object" && "error" in result) {
    if (result.error) {
      // On error, state remains "unsynced" - RTK Query will retry automatically
      return;
    }
    // Success - mark as synced
    config.dispatch(identitiesSlice.actions.markSyncCompleted());
  }
}

/**
 * Creates a Redux middleware that automatically syncs device IDs to the backend
 * whenever the identities state changes.
 *
 * @param config - Configuration for the sync middleware
 * @returns Redux middleware
 */
export function createIdentitiesSyncMiddleware<State>(
  config: SyncMiddlewareConfig<State>,
): Middleware {
  let isSyncing = false;

  return _store => next => action => {
    const result = next(action);

    if (isSyncing) {
      return result;
    }

    const state = config.getState();
    if (!shouldSync(state, config)) {
      return result;
    }

    isSyncing = true;
    attemptSync(state, config).finally(() => {
      isSyncing = false;
    });

    return result;
  };
}
