import { configureStore } from "@reduxjs/toolkit";
import {
  createFeatureFlagsMiddleware,
  featureFlagsReducer,
  setCachedFlagsSettled,
  type PartialFeatures,
} from "@shared/feature-flags";
import { whenCachedFlagsSettled } from "./whenCachedFlagsSettled";

const createStore = () => configureStore({ reducer: { featureFlags: featureFlagsReducer } });

describe("whenCachedFlagsSettled", () => {
  it("waits until the cache has settled", async () => {
    const store = createStore();
    const onSettled = jest.fn();

    void whenCachedFlagsSettled(store).then(onSettled);
    await jest.runAllTimersAsync();
    expect(onSettled).not.toHaveBeenCalled();

    store.dispatch(setCachedFlagsSettled());
    await jest.runAllTimersAsync();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("resolves right away when the cache has already settled", async () => {
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    await expect(whenCachedFlagsSettled(store)).resolves.toBeUndefined();
  });

  it("stops listening once resolved", async () => {
    const store = createStore();
    const unsubscribe = jest.fn();
    const fakeStore = {
      getState: store.getState,
      subscribe: (listener: () => void) => {
        const release = store.subscribe(listener);
        return () => {
          unsubscribe();
          release();
        };
      },
    };

    const settled = whenCachedFlagsSettled(fakeStore);
    store.dispatch(setCachedFlagsSettled());
    await settled;

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("releases with the cached values already resolved, before the network answers", async () => {
    const store = configureStore({
      reducer: { featureFlags: featureFlagsReducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
          createFeatureFlagsMiddleware({
            resolutionConfig: {},
            readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
            fetchRemoteFlags: () => new Promise<PartialFeatures>(() => {}),
          }),
        ),
    });

    await whenCachedFlagsSettled(store);

    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(false);
  });
});
