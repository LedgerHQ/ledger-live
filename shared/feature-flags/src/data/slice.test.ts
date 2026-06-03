/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { configureStore } from "@reduxjs/toolkit";
import {
  featureFlagsReducer,
  setOverride,
  setAllOverrides,
  setBannerVisible,
  setRemoteFlagsReady,
  importState,
} from "./slice";
import { createFeatureFlagsMiddleware, type FeatureFlagsMiddlewareConfig } from "./middleware";
import type { ResolutionConfig, FeatureFlagsState, PartialFeatures } from "./schema";
import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS } from "../constants";

const defaults = FEATURE_FLAGS_DEFAULTS;

// Yields several times to drain multi-await chains (e.g. the middleware's `tick()`
// fetches and then dispatches inside the same async function). Uses Promise.resolve()
// rather than queueMicrotask/setImmediate so it works under jest.useFakeTimers().
const flushPromises = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

// Fake timers are enabled globally so the middleware's setInterval doesn't leak
// real timers into Jest's worker (otherwise the process can't exit cleanly).
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

function createStore(
  preloadedState?: FeatureFlagsState,
  middlewareConfig: Partial<FeatureFlagsMiddlewareConfig> = {},
) {
  return configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: preloadedState ? { featureFlags: preloadedState } : undefined,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        createFeatureFlagsMiddleware({ resolutionConfig: {}, ...middlewareConfig }),
      ),
  });
}

async function createStoreWithRemote(
  remote: PartialFeatures = {},
  resolutionConfig: ResolutionConfig = {},
) {
  const store = createStore(undefined, {
    resolutionConfig,
    fetchRemoteFlags: () => Promise.resolve(remote),
  });
  await flushPromises();
  return store;
}

describe("featureFlagsSlice reducers", () => {
  it("has correct initial state", () => {
    const store = createStore();
    expect(store.getState().featureFlags).toEqual({
      overrides: {},
      resolved: defaults,
      bannerVisible: false,
      remoteFlagsReady: false,
    });
  });

  describe("setOverride", () => {
    it("adds a new override and resolves it", () => {
      const store = createStore();
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
      expect(store.getState().featureFlags.overrides.mockFeature).toEqual({ enabled: true });
      expect(store.getState().featureFlags.resolved.mockFeature).toEqual({ enabled: true });
    });

    it("updates an existing override", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: true } },
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
        remoteFlagsReady: false,
      });
      store.dispatch(
        setOverride({ key: "mockFeature", value: { enabled: false, params: { x: 1 } } }),
      );
      expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
        enabled: false,
        params: { x: 1 },
      });
    });

    it("removes an override when value is undefined", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: true } },
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
        remoteFlagsReady: false,
      });
      store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
      expect(store.getState().featureFlags.overrides.mockFeature).toBeUndefined();
    });

    it("removing an override falls back to default when no remote exists", () => {
      const store = createStore();
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
      store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
      expect(store.getState().featureFlags.resolved.mockFeature).toEqual(defaults.mockFeature);
    });
  });

  describe("setAllOverrides", () => {
    it("replaces the entire overrides map and re-resolves", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: true } },
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
        remoteFlagsReady: false,
      });
      store.dispatch(setAllOverrides({ ptxCard: { enabled: false } }));
      expect(store.getState().featureFlags.overrides).toEqual({ ptxCard: { enabled: false } });
      expect(store.getState().featureFlags.overrides.mockFeature).toBeUndefined();
    });
  });

  describe("setBannerVisible", () => {
    it("sets bannerVisible to true", () => {
      const store = createStore();
      store.dispatch(setBannerVisible(true));
      expect(store.getState().featureFlags.bannerVisible).toBe(true);
    });
  });

  describe("setRemoteFlagsReady", () => {
    it("starts false and flips to true once, idempotently", () => {
      const store = createStore();
      expect(store.getState().featureFlags.remoteFlagsReady).toBe(false);

      store.dispatch(setRemoteFlagsReady());
      expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);

      store.dispatch(setRemoteFlagsReady());
      store.dispatch(setRemoteFlagsReady());
      expect(store.getState().featureFlags).toEqual({
        overrides: {},
        resolved: defaults,
        bannerVisible: false,
        remoteFlagsReady: true,
      });
    });
  });

  describe("importState", () => {
    it("replaces entire state", () => {
      const store = createStore();
      const newState: FeatureFlagsState = {
        overrides: { mockFeature: { enabled: true, params: "test" } },
        resolved: { ...defaults, mockFeature: { enabled: true, params: "test" } },
        bannerVisible: true,
        remoteFlagsReady: true,
      };
      store.dispatch(importState(newState));
      expect(store.getState().featureFlags).toEqual(newState);
    });
  });
});

describe("resolution via meta", () => {
  it("remote flags from middleware are reflected in resolved state", async () => {
    const store = await createStoreWithRemote({
      mockFeature: { enabled: true, params: { v: 1 } },
      ptxCard: { enabled: false },
    });
    const { resolved } = store.getState().featureFlags;
    expect(resolved.mockFeature).toEqual({ enabled: true, params: { v: 1 } });
    expect(resolved.ptxCard).toEqual({ enabled: false });
  });

  it("local overrides take priority over remote", async () => {
    const store = await createStoreWithRemote({ mockFeature: { enabled: true } });
    store.dispatch(
      setOverride({
        key: "mockFeature",
        value: { enabled: false, overridesRemote: true },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: false,
      overridesRemote: true,
    });
  });

  it("version filtering disables flag when version does not match", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: true, desktop_version: ">=2.0.0" } },
      { platform: "desktop", appVersion: "1.0.0" },
    );
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(false);
    expect(resolved.enabledOverriddenForCurrentVersion).toBe(true);
  });

  it("version filtering keeps flag when version matches", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: true, desktop_version: ">=2.0.0" } },
      { platform: "desktop", appVersion: "3.0.0" },
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("mobile_version is used for ios/android platforms", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: true, mobile_version: ">=2.0.0" } },
      { platform: "ios", appVersion: "1.0.0" },
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);
  });

  it("language whitelist disables flag when language is not whitelisted", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: true, languages_whitelisted: ["en", "fr"] } },
      { appLanguage: "de" },
    );
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(false);
    expect(resolved.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("language blacklist disables flag when language is blacklisted", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: true, languages_blacklisted: ["de"] } },
      { appLanguage: "de" },
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);
  });

  it("language filtering does not apply to local overrides", () => {
    const store = createStore(undefined, { resolutionConfig: { appLanguage: "de" } });
    store.dispatch(
      setOverride({
        key: "mockFeature",
        value: { enabled: true, languages_whitelisted: ["en"] },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("env flags override remote config", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: false } },
      { envFlags: { mockFeature: { enabled: true, params: { envOverride: true } } } },
    );
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(true);
    expect(resolved.overriddenByEnv).toBe(true);
    expect(resolved.overridesRemote).toBe(true);
  });

  it("resolution priority: local override > env > remote", async () => {
    const store = await createStoreWithRemote(
      { mockFeature: { enabled: false } },
      { envFlags: { mockFeature: { enabled: false } } },
    );
    store.dispatch(
      setOverride({
        key: "mockFeature",
        value: { enabled: true, overridesRemote: true },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });
});

describe("middleware behavior", () => {
  it("dispatches an initial fetch and updates resolved state", async () => {
    const fetcher = jest.fn().mockResolvedValue({ mockFeature: { enabled: true } });
    const store = createStore(undefined, { fetchRemoteFlags: fetcher });
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("polls every refreshInterval", async () => {
    const fetcher = jest.fn().mockResolvedValue({ mockFeature: { enabled: true } });
    createStore(undefined, { fetchRemoteFlags: fetcher, refreshInterval: 1_000 });
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("uses FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS when refreshInterval is omitted", async () => {
    const fetcher = jest.fn().mockResolvedValue({});
    createStore(undefined, { fetchRemoteFlags: fetcher });
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS - 1);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not crash and keeps last good cache when fetchRemoteFlags rejects", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({ mockFeature: { enabled: true } })
      .mockRejectedValueOnce(new Error("network down"));
    const store = createStore(undefined, { fetchRemoteFlags: fetcher, refreshInterval: 1_000 });

    await flushPromises();
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);

    jest.advanceTimersByTime(1_000);
    await flushPromises();
    // Reducer state is unchanged because syncRemoteConfig is not dispatched on failure;
    // the previous resolved value remains visible.
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("marks remoteFlagsReady after the first successful fetch", async () => {
    const store = createStore(undefined, {
      fetchRemoteFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
    });
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(false);

    await flushPromises();
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
  });

  it("marks remoteFlagsReady even when the first fetch rejects", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network down"));
    const store = createStore(undefined, { fetchRemoteFlags: fetcher, refreshInterval: 1_000 });

    await flushPromises();
    // syncRemoteConfig never fires on failure, so resolved stays at defaults.
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual(defaults.mockFeature);
  });

  it("does not schedule any timer when fetchRemoteFlags is omitted", () => {
    createStore();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("setOverride uses remote flags from middleware cache", async () => {
    const store = await createStoreWithRemote({
      mockFeature: { enabled: true, params: { remote: true } },
    });
    store.dispatch(setOverride({ key: "mockFeature", value: { enabled: false } }));
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);

    store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { remote: true },
    });
  });

  it("setAllOverrides uses remote flags for non-overridden keys", async () => {
    const store = await createStoreWithRemote({
      mockFeature: { enabled: true, params: { v: 1 } },
    });
    store.dispatch(setAllOverrides({ ptxCard: { enabled: true } }));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { v: 1 },
    });
    expect(store.getState().featureFlags.resolved.ptxCard.enabled).toBe(true);
  });
});
