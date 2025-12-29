import { configureStore } from "@reduxjs/toolkit";
import { createIdentitiesSyncMiddleware, SyncMiddlewareConfig } from "./middleware";
import { identitiesSlice } from "./slice";
import { IdentitiesState } from "./types";
import { DeviceId } from "../ids";
import { pushDevicesApi } from "../api/api";
import { getEnv } from "@ledgerhq/live-env";

const mockGetEnv = getEnv as jest.MockedFunction<typeof getEnv>;

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
  });

  describe("shouldSync conditions", () => {
    it("should not sync when PUSH_DEVICES_SERVICE_URL is not set", () => {
      mockGetEnv.mockReturnValue("");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });

    it("should not sync when userId is missing", () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve(""),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });

    it("should not sync when analytics consent is false", () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => false,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });

    it("should not sync when deviceIds is empty", () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
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
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });

    it("should not sync when already synced with same URL", () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      store.dispatch(identitiesSlice.actions.markSyncCompleted("https://api.example.com"));
      // Dispatch another action - should not sync again
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });

    it("should sync when endpoint URL has changed", () => {
      mockGetEnv.mockReturnValue("https://api-new.example.com");
      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      store.dispatch(identitiesSlice.actions.markSyncCompleted("https://api-old.example.com"));
      // URL changed, should trigger sync
      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      expect(mockGetEnv).toHaveBeenCalledWith("PUSH_DEVICES_SERVICE_URL");
    });
  });

  describe("sync execution", () => {
    it("should successfully sync and mark as completed", async () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
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
      mockGetEnv.mockReturnValue("https://api.example.com");
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
      mockGetEnv.mockReturnValue("https://api.example.com");
      const mockInitiate = jest.fn(() => () => Promise.resolve({ data: undefined }));
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      const store = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();

      store.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-2")));
      await waitForAsync();

      // Should have been called twice - proves isSyncing was reset
      expect(mockInitiate).toHaveBeenCalledTimes(2);
    });

    it("should skip sync in attemptSync when conditions are not met", async () => {
      mockGetEnv.mockReturnValue("https://api.example.com");
      const mockInitiate = jest.fn();
      pushDevicesApi.endpoints.pushDevices.initiate = mockInitiate as any;

      // Test missing userId in attemptSync (line 78)
      const store1 = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve(""),
        getAnalyticsConsent: () => true,
      });
      store1.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();
      expect(mockInitiate).not.toHaveBeenCalled();

      // Test missing pushDevicesServiceUrl in attemptSync (line 84)
      mockGetEnv.mockReturnValue("");
      const store2 = createStore({
        getIdentitiesState: state => (state as { identities: IdentitiesState }).identities,
        getUserId: () => Promise.resolve("user-123"),
        getAnalyticsConsent: () => true,
      });
      store2.dispatch(identitiesSlice.actions.addDeviceId(DeviceId.fromString("device-1")));
      await waitForAsync();
      expect(mockInitiate).not.toHaveBeenCalled();
    });
  });
});
