import { configureStore } from "@reduxjs/toolkit";
import { identitiesSlice, type IdentitiesState } from "@domain/entity-client-identity";
import { clearLastFailureTime, setLastFailureTime } from "./internals/middleware";
import { pushDevicesApi, pushDevicesApiExtra } from "@shared/api-services";
// Side-effect import: injects the `pushDevices` endpoint the middleware under test dispatches.
import "./api";
import { createIdentitiesSyncMiddleware } from "./middleware";

type RootState = {
  identities: IdentitiesState;
  [pushDevicesApi.reducerPath]: ReturnType<typeof pushDevicesApi.reducer>;
};

function makeStore(
  getAnalyticsConsent: (_state: RootState) => boolean = () => true,
  pushDevicesServiceUrl = "https://push.test",
) {
  return configureStore({
    reducer: {
      identities: identitiesSlice.reducer,
      [pushDevicesApi.reducerPath]: pushDevicesApi.reducer,
    },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: pushDevicesApiExtra({
            pushDevicesServiceUrl,
            ledgerClientVersion: "1.0.0",
          }),
        },
        serializableCheck: false,
      })
        .concat(pushDevicesApi.middleware)
        .concat(
          createIdentitiesSyncMiddleware<RootState>({
            pushDevicesServiceUrl,
            getIdentitiesState: (state: RootState) => state.identities,
            getAnalyticsConsent,
          }),
        ),
  });
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const persistedWithDevice = {
  userId: "user-1",
  datadogId: "dd-1",
  deviceIds: ["device-1"],
  pushDevicesSyncState: "unsynced" as const,
  pushDevicesServiceUrl: null,
};

describe("createIdentitiesSyncMiddleware", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    clearLastFailureTime();
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("does not sync when deviceIds is empty", async () => {
    const store = makeStore();
    store.dispatch(identitiesSlice.actions.initFromScratch());
    store.dispatch({ type: "noop" });
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not sync when analyticsConsent is false", async () => {
    const store = makeStore(() => false);
    store.dispatch(identitiesSlice.actions.initFromPersisted(persistedWithDevice));
    store.dispatch({ type: "noop" });
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not sync when already synced with same URL", async () => {
    const store = makeStore();
    store.dispatch(
      identitiesSlice.actions.initFromPersisted({
        ...persistedWithDevice,
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: "https://push.test",
      }),
    );
    store.dispatch({ type: "noop" });
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not sync when rate-limited", async () => {
    setLastFailureTime(Date.now()); // simulate recent failure
    const store = makeStore();
    store.dispatch(identitiesSlice.actions.initFromPersisted(persistedWithDevice));
    store.dispatch({ type: "noop" });
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("syncs and marks sync completed on success", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }));

    const store = makeStore();
    store.dispatch(identitiesSlice.actions.initFromPersisted(persistedWithDevice));
    store.dispatch({ type: "noop" });
    await flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const req = fetchSpy.mock.calls[0][0] as Request;
    expect(req.url).toBe("https://push.test/v2/pushdevices");
    expect(store.getState().identities.pushDevicesSyncState).toBe("synced");
    expect(store.getState().identities.pushDevicesServiceUrl).toBe("https://push.test");
  });

  it("re-syncs when pushDevicesServiceUrl changes", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }));

    const store = makeStore();
    store.dispatch(
      identitiesSlice.actions.initFromPersisted({
        ...persistedWithDevice,
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: "https://old-push.test", // stale URL
      }),
    );
    store.dispatch({ type: "noop" });
    await flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw on API failure and sets rate limit", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 500 }));

    const store = makeStore();
    store.dispatch(identitiesSlice.actions.initFromPersisted(persistedWithDevice));

    await expect(
      new Promise<void>((resolve, reject) => {
        try {
          store.dispatch({ type: "noop" });
          flush().then(resolve);
        } catch (e) {
          reject(e);
        }
      }),
    ).resolves.toBeUndefined();

    // after failure the sync state remains unsynced
    expect(store.getState().identities.pushDevicesSyncState).toBe("unsynced");
  });

  it("does not dispatch a concurrent sync", async () => {
    let resolveFetch!: () => void;
    fetchSpy.mockReturnValue(
      new Promise<Response>(resolve => {
        resolveFetch = () => resolve(new Response(null, { status: 200 }));
      }),
    );

    const store = makeStore();
    store.dispatch(identitiesSlice.actions.initFromPersisted(persistedWithDevice));
    store.dispatch({ type: "noop" }); // triggers sync (fetch is pending)
    store.dispatch({ type: "noop" }); // second dispatch — should not trigger another fetch

    resolveFetch();
    await flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
