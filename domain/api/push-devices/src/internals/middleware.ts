import { isDummyUserId, identitiesSlice } from "@domain/entity-client-identity";
import type { IdentitiesState } from "@domain/entity-client-identity";
import { pushDevicesApi, createPushDevicesRequest } from "../api";

export type Dispatch = (action: any) => any;

export const RATE_LIMIT_MS = 5 * 60 * 1000;

let _lastFailureTime: number | undefined;
export function getLastFailureTime(): number | undefined {
  return _lastFailureTime;
}
export function setLastFailureTime(time: number): void {
  _lastFailureTime = time;
}
export function clearLastFailureTime(): void {
  _lastFailureTime = undefined;
}

export interface SyncMiddlewareConfig<State = unknown> {
  /**
   * The Push Devices Service URL. An empty string disables sync.
   * Pass `getEnv("PUSH_DEVICES_SERVICE_URL")` at store setup time.
   */
  pushDevicesServiceUrl: string;

  /**
   * Selector returning the identities slice of the Redux state.
   * Example: `(state) => state.identities`
   * Gives the middleware access to userId, deviceIds, and sync status.
   */
  getIdentitiesState: (state: State) => IdentitiesState;

  /**
   * Selector returning true when the app has analytics consent.
   * The app is responsible for combining all consent gates so the middleware
   * only pushes device IDs when this returns true.
   */
  getAnalyticsConsent: (state: State) => boolean;

  /**
   * Optional: resolve userId (e.g. from legacy app user). Used by mobile until
   * it fully migrates to identities store. Desktop does not pass this.
   */
  getUserId?: (state: State) => Promise<string>;
}

export function canAttemptSync(): boolean {
  const lastFailureTime = getLastFailureTime();
  if (!lastFailureTime) return true;
  return Date.now() - lastFailureTime >= RATE_LIMIT_MS;
}

export function shouldSync<State>(state: State, config: SyncMiddlewareConfig<State>): boolean {
  if (!config.pushDevicesServiceUrl) return false;
  if (!canAttemptSync()) return false;

  const identitiesState = config.getIdentitiesState(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  if (!analyticsConsent) return false;
  if (isDummyUserId(identitiesState.userId) && !config.getUserId) return false;
  if (identitiesState.deviceIds.length === 0) return false;

  if (identitiesState.pushDevicesServiceUrl !== config.pushDevicesServiceUrl) return true;

  return identitiesState.pushDevicesSyncState === "unsynced";
}

export async function attemptSync<State>(
  state: State,
  config: SyncMiddlewareConfig<State>,
  dispatch: Dispatch,
): Promise<void> {
  const identitiesState = config.getIdentitiesState(state);
  const analyticsConsent = config.getAnalyticsConsent(state);

  if (!analyticsConsent || identitiesState.deviceIds.length === 0) return;
  if (!config.pushDevicesServiceUrl) return;

  let userId: string;
  if (isDummyUserId(identitiesState.userId)) {
    if (!config.getUserId) return;
    userId = await config.getUserId(state);
    if (typeof userId !== "string" || userId.trim() === "") return;
  } else {
    userId = identitiesState.userId.exportUserIdForPushDevicesService();
  }

  const request = createPushDevicesRequest(userId, identitiesState.deviceIds);
  const result = await dispatch(pushDevicesApi.endpoints.pushDevices.initiate(request));

  if (result && typeof result === "object") {
    if ("error" in result && result.error) {
      setLastFailureTime(Date.now());
      return;
    }
    clearLastFailureTime();
    dispatch(identitiesSlice.actions.markSyncCompleted(config.pushDevicesServiceUrl));
  }
}
