import { Middleware } from "@reduxjs/toolkit";
import { IdentitiesState } from "./types";
import { identitiesSlice } from "./slice";
import { pushDevicesApi, createPushDevicesRequest } from "../api/api";
import { getEnv } from "@ledgerhq/live-env";

type Dispatch = (action: any) => any;

/**
 * Configuration for the sync middleware
 */
export interface SyncMiddlewareConfig<State = unknown> {
  /**
   * Selector to get identities state from the global state
   */
  getIdentitiesState: (state: State) => IdentitiesState;

  /**
   * Function to get user ID (equipment_id) asynchronously
   * This is managed by apps, not by the identities store
   */
  getUserId: (state: State) => Promise<string>;

  /**
   * Selector to get analytics consent from the global state
   * This avoids duplicating analytics consent in the identities state
   */
  getAnalyticsConsent: (state: State) => boolean;
}

/**
 * Check if identities state needs to be synced
 * Note: userId check is done in attemptSync since getUserId is async
 */
function shouldSync<State>(state: State, config: SyncMiddlewareConfig<State>): boolean {
  // Bypass sync if PUSH_DEVICES_SERVICE_URL is not configured
  const pushDevicesServiceUrl = getEnv("PUSH_DEVICES_SERVICE_URL");
  if (!pushDevicesServiceUrl) {
    return false;
  }

  const identitiesState = config.getIdentitiesState(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  if (!analyticsConsent) {
    return false;
  }

  if (identitiesState.deviceIds.length === 0) {
    return false;
  }

  // If the endpoint URL has changed, consider as unsynced
  if (identitiesState.pushDevicesServiceUrl !== pushDevicesServiceUrl) {
    return true;
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
  dispatch: Dispatch,
): Promise<void> {
  const identitiesState = config.getIdentitiesState(state);
  const userId = await config.getUserId(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  // Skip sync if no userId, no consent, or no device IDs
  if (!userId || !analyticsConsent || identitiesState.deviceIds.length === 0) {
    return;
  }

  const pushDevicesServiceUrl = getEnv("PUSH_DEVICES_SERVICE_URL");
  if (!pushDevicesServiceUrl) {
    // If the endpoint URL is not configured, skip sync
    return;
  }

  const request = createPushDevicesRequest(userId, identitiesState.deviceIds);
  const result = await dispatch(pushDevicesApi.endpoints.pushDevices.initiate(request));

  // RTK Query initiate returns { error } on failure or { data } on success
  if (result && typeof result === "object") {
    // Check if there's an error
    if ("error" in result && result.error) {
      // On error, state remains "unsynced" - RTK Query will retry automatically
      return;
    }
    // Success (no error) - mark as synced with the endpoint URL used
    dispatch(identitiesSlice.actions.markSyncCompleted(pushDevicesServiceUrl));
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
  function sync(state: State, dispatch: Dispatch) {
    isSyncing = true;
    attemptSync(state, config, dispatch).finally(() => {
      isSyncing = false;
    });
  }

  return store => next => action => {
    if (!isSyncing) {
      const result = next(action);
      const state = store.getState();
      if (shouldSync(state, config)) {
        sync(state, store.dispatch);
      }
      return result;
    }
    return next(action);
  };
}
