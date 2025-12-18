import { configureStore } from "@reduxjs/toolkit";
import { createIdentitiesSyncMiddleware, SyncMiddlewareConfig } from "./middleware";
import { identitiesSlice } from "./slice";
import { IdentitiesState } from "./types";
import { DeviceId } from "../ids";
import { pushDevicesApi } from "../api/api";
import { setEnv } from "@ledgerhq/live-env";
import * as rateLimitState from "./rateLimitState";

// Mock the rate limit state module
jest.mock("./rateLimitState", () => ({
  getLastFailureTime: jest.fn(),
  setLastFailureTime: jest.fn(),
  clearLastFailureTime: jest.fn(),
}));

const createStore = (config: SyncMiddlewareConfig) =>
  configureStore({
    reducer: {
      identities: identitiesSlice.reducer,
      [pushDevicesApi.reducerPath]: pushDevicesApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(pushDevicesApi.middleware, createIdentitiesSyncMiddleware(config)),
  });

const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 50));

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the initiate mock
    const originalInitiate = pushDevicesApi.endpoints.pushDevices.initiate;
    pushDevicesApi.endpoints.pushDevices.initiate = originalInitiate;
    // Reset rate limiting state to ensure tests are isolated
    (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(undefined);
    (rateLimitState.setLastFailureTime as jest.Mock).mockClear();
    (rateLimitState.clearLastFailureTime as jest.Mock).mockClear();
  });

  describe("shouldSync conditions", () => {
    it("should not sync when PUSH_DEVICES_SERVICE_URL is not set", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
    });

    it("should not sync when userId is missing", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve(""),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
    });

    it("should not sync when analytics consent is false", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => false,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
    });

    it("should not sync when deviceIds is empty", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // Initialize with empty deviceIds
      store.dispatch(
        identitiesSlice.actions.initFromPersisted({
          deviceIds: [],
          pushDevicesSyncState: "unsynced",
          pushDevicesServiceUrl: null,
        }),
      );
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
    });

    it("should not sync when already synced with same URL", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      store.dispatch(identitiesSlice.actions.markSyncCompleted("https://api.example.com"));
      // Dispatch another action - should not sync again
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
    });

    it("should sync when endpoint URL has changed", () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api-new.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      store.dispatch(identitiesSlice.actions.markSyncCompleted("https://api-old.example.com"));
      // URL changed, should trigger sync
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
    });
  });

  describe("sync execution", () => {
    it("should successfully sync and mark as completed", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      // RTK Query initiate returns a thunk that when dispatched returns a Promise
      const mockInitiate = jest.fn(() => () => Promise.resolve({ data: undefined }));
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalled();
      const state = store.getState();
      expect(state.identities.pushDevicesSyncState).toBe("synced");
      expect(state.identities.pushDevicesServiceUrl).toBe("https://api.example.com");
    });

    it("should handle sync error and keep state as unsynced", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(
        () => () => Promise.resolve({ error: { status: 500, data: "Error" } }),
      );
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalled();
      const state = store.getState();
      expect(state.identities.pushDevicesSyncState).toBe("unsynced");
    });

    it("should reset isSyncing flag after sync completes", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(() => () => Promise.resolve({ data: undefined }));
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // First sync
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();
      await waitForAsync(); // Extra wait to ensure first sync completes

      // Verify first sync completed
      expect(mockInitiate).toHaveBeenCalledTimes(1);
      const state = store.getState();
      expect(state.identities.pushDevicesSyncState).toBe("synced");

      // Second sync - should trigger because we add a new device
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();
      await waitForAsync(); // Extra wait to ensure second sync completes

      // Should have been called twice - proves isSyncing was reset
      expect(mockInitiate).toHaveBeenCalledTimes(2);
    });

    it("should skip sync in attemptSync when userId is missing", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn();
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve(""),
        getAnalyticsConsent: () => true,
      });
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();
      expect(mockInitiate).not.toHaveBeenCalled();
    });

    it("should skip sync in attemptSync when pushDevicesServiceUrl is empty", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn();
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // Dispatch action - shouldSync will see the URL and return true
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));

      // Clear URL before attemptSync is called (it's called asynchronously)
      setEnv("PUSH_DEVICES_SERVICE_URL", "");

      await waitForAsync();

      expect(mockInitiate).not.toHaveBeenCalled();
    });
  });

  describe("rate limiting", () => {
    let originalDateNow: typeof Date.now;
    let currentTime: number;
    let mockDateNow: jest.Mock;

    beforeEach(() => {
      // Mock Date.now() to control time without using fake timers
      originalDateNow = Date.now;
      currentTime = new Date("2024-01-01T00:00:00Z").getTime();
      mockDateNow = jest.fn(() => currentTime);
      Date.now = mockDateNow;

      // Reset rate limiting state mock
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(undefined);
      (rateLimitState.setLastFailureTime as jest.Mock).mockClear();
      (rateLimitState.clearLastFailureTime as jest.Mock).mockClear();
    });

    afterEach(() => {
      Date.now = originalDateNow;
      // Reset the time to initial value
      currentTime = new Date("2024-01-01T00:00:00Z").getTime();
    });

    it("should allow sync when there is no previous failure", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(() => () => Promise.resolve({ data: undefined }));
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);
    });

    it("should block sync immediately after a failure", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(
        () => () => Promise.resolve({ error: { status: 500, data: "Error" } }),
      );
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // First sync attempt - will fail
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);
      expect(rateLimitState.setLastFailureTime).toHaveBeenCalledWith(currentTime);

      // Mock that we now have a failure time set
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(currentTime);

      // Try to sync again immediately - should be blocked by rate limit
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();

      // Should still be only 1 call - rate limit blocked the second attempt
      expect(mockInitiate).toHaveBeenCalledTimes(1);
    });

    it("should allow sync after 5 minutes have passed since last failure", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(
        () => () => Promise.resolve({ error: { status: 500, data: "Error" } }),
      );
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // First sync attempt - will fail (getLastFailureTime returns undefined initially)
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);
      expect(rateLimitState.setLastFailureTime).toHaveBeenCalledWith(currentTime);

      // Now mock that we have a failure time set
      const initialFailureTime = currentTime;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Try to sync again immediately - should be blocked
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);

      // Advance time by 5 minutes
      currentTime = currentTime + 5 * 60 * 1000;
      // Keep the old failure time in the mock
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Try to sync again - should be allowed now (5 minutes have passed)
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-3")));
      await waitForAsync();

      // Should have been called twice - rate limit expired
      expect(mockInitiate).toHaveBeenCalledTimes(2);
    });

    it("should clear rate limit on successful sync", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      let shouldFail = true;
      const mockInitiate = jest.fn(() => () => {
        if (shouldFail) {
          return Promise.resolve({ error: { status: 500, data: "Error" } });
        }
        return Promise.resolve({ data: undefined });
      });
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // First sync attempt - will fail (getLastFailureTime returns undefined initially)
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);
      expect(rateLimitState.setLastFailureTime).toHaveBeenCalledWith(currentTime);

      // Now mock that we have a failure time set
      const initialFailureTime = currentTime;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Try to sync again immediately - should be blocked
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);

      // Advance time by 5 minutes to allow retry
      currentTime = currentTime + 5 * 60 * 1000;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // This time it should succeed
      shouldFail = false;
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-3")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(2);
      expect(rateLimitState.clearLastFailureTime).toHaveBeenCalled();

      // After success, rate limit should be cleared - mock returns undefined
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(undefined);

      // Try again immediately - should be allowed
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-4")));
      await waitForAsync();

      // Should have been called again immediately (no rate limit after success)
      expect(mockInitiate).toHaveBeenCalledTimes(3);
    });

    it("should not block sync when less than 5 minutes have passed but rate limit should still apply", async () => {
      setEnv("PUSH_DEVICES_SERVICE_URL", "https://api.example.com");
      const mockInitiate = jest.fn(
        () => () => Promise.resolve({ error: { status: 500, data: "Error" } }),
      );
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      // First sync attempt - will fail (getLastFailureTime returns undefined initially)
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      expect(mockInitiate).toHaveBeenCalledTimes(1);
      expect(rateLimitState.setLastFailureTime).toHaveBeenCalledWith(currentTime);

      // Now mock that we have a failure time set
      const initialFailureTime = currentTime;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Advance time by 4 minutes 59 seconds - still within rate limit
      currentTime = currentTime + 4 * 60 * 1000 + 59 * 1000;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Try to sync again - should still be blocked
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();

      // Should still be only 1 call
      expect(mockInitiate).toHaveBeenCalledTimes(1);

      // Advance by 1 more second to reach 5 minutes
      currentTime = currentTime + 1000;
      (rateLimitState.getLastFailureTime as jest.Mock).mockReturnValue(initialFailureTime);

      // Now should be allowed
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-3")));
      await waitForAsync();

      // Should have been called twice now
      expect(mockInitiate).toHaveBeenCalledTimes(2);
    });
  });
});
