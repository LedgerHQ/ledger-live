/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { configureStore, type Middleware } from "@reduxjs/toolkit";
import {
  featureFlagsReducer,
  setOverride,
  setAllOverrides,
  setBannerVisible,
  setRemoteFlagsReady,
  syncRemoteConfig,
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
    // syncRemoteConfig already fired on the earlier success, so the failed poll does
    // not re-resolve (the one-shot guard is spent); the previous value remains visible.
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
    // With no overrides/env and an empty remote, the first-settle re-resolve yields defaults.
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual(defaults.mockFeature);
  });

  it("applies envFlags at boot even when the first fetch fails", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network down"));
    const store = createStore(undefined, {
      resolutionConfig: {
        envFlags: { mockFeature: { enabled: true, params: { fromEnv: true } } },
      },
      fetchRemoteFlags: fetcher,
      refreshInterval: 1_000,
    });

    await flushPromises();
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { fromEnv: true },
      overridesRemote: true,
      overriddenByEnv: true,
    });
  });

  it("dispatches syncRemoteConfig only once across repeated failed polls", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network down"));
    const dispatchedTypes: string[] = [];
    const recorder: Middleware = () => next => action => {
      dispatchedTypes.push((action as { type: string }).type);
      return next(action);
    };
    const store = configureStore({
      reducer: { featureFlags: featureFlagsReducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware()
          .concat(recorder)
          .concat(
            createFeatureFlagsMiddleware({
              resolutionConfig: {},
              fetchRemoteFlags: fetcher,
              refreshInterval: 1_000,
            }),
          ),
    });

    await flushPromises(); // first settle (failure) → one syncRemoteConfig
    jest.advanceTimersByTime(1_000);
    await flushPromises(); // second failed poll → no re-resolve
    jest.advanceTimersByTime(1_000);
    await flushPromises(); // third failed poll → no re-resolve

    const syncs = dispatchedTypes.filter(type => type === syncRemoteConfig.type).length;
    expect(syncs).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
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

  it("injects the current language from getAppLanguage and re-resolves when it changes", async () => {
    let lang = "en";
    const store = createStore(undefined, {
      fetchRemoteFlags: () =>
        Promise.resolve({ mockFeature: { enabled: true, languages_whitelisted: ["en"] } }),
      getAppLanguage: () => lang,
    });
    await flushPromises();
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);

    // A non-feature-flags action triggers the language-change check.
    lang = "de";
    store.dispatch({ type: "settings/setLanguage" });
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(false);
    expect(resolved.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("does not re-resolve when an unrelated action leaves the language unchanged", async () => {
    const getAppLanguage = jest.fn(() => "en");
    const store = createStore(undefined, {
      fetchRemoteFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      getAppLanguage,
    });
    await flushPromises();
    const before = store.getState().featureFlags.resolved;
    store.dispatch({ type: "settings/somethingElse" });
    expect(store.getState().featureFlags.resolved).toBe(before);
  });
});

describe("cache prime", () => {
  it("resolves flags from the cache without arming readiness", async () => {
    // A fetch that never settles: anything resolved here can only come from the cache. Readiness
    // keeps its original meaning and waits for that first call, so the boot gates are unchanged.
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      fetchRemoteFlags: () => new Promise<PartialFeatures>(() => {}),
    });

    await flushPromises();

    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(false);
  });

  it("arms readiness once the first fetch settles, cache or no cache", async () => {
    let settle: (flags: PartialFeatures) => void = () => {};
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      fetchRemoteFlags: () => new Promise<PartialFeatures>(resolve => (settle = resolve)),
    });

    await flushPromises();
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(false);

    settle({ mockFeature: { enabled: true } });
    await flushPromises();

    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
  });

  it("arms readiness itself when there is no fetcher to wait for", async () => {
    // Nothing else would ever settle, so leaving the gate shut would strand consumers.
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
    });

    await flushPromises();

    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
  });

  it("still applies envFlags when there is no fetcher and the cache is empty", async () => {
    // On this branch the prime is the only thing that will ever open the gate, so it has to stand
    // in for the first poll completely. Arming readiness without re-resolving would release
    // consumers onto the raw compiled defaults, with env overrides and version filters never
    // applied. An unreadable cache lands on this same branch.
    const store = createStore(undefined, {
      resolutionConfig: {
        envFlags: { mockFeature: { enabled: true, params: { fromEnv: true } } },
      },
      readCachedFlags: () => Promise.resolve({}),
    });

    await flushPromises();

    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { fromEnv: true },
      overridesRemote: true,
      overriddenByEnv: true,
    });
    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
  });

  it("lets a successful poll overwrite the primed values", async () => {
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: false } }),
      fetchRemoteFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
    });

    await flushPromises();

    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("keeps the primed values and does not re-resolve when the first poll fails", async () => {
    const dispatchedTypes: string[] = [];
    const recorder: Middleware = () => next => action => {
      dispatchedTypes.push((action as { type: string }).type);
      return next(action);
    };
    const store = configureStore({
      reducer: { featureFlags: featureFlagsReducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware()
          .concat(recorder)
          .concat(
            createFeatureFlagsMiddleware({
              resolutionConfig: {},
              readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
              fetchRemoteFlags: () => Promise.reject(new Error("network down")),
              refreshInterval: 1_000,
            }),
          ),
    });

    await flushPromises();

    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
    // The prime already spent the one-shot guard, so the failed poll must not re-resolve.
    expect(dispatchedTypes.filter(type => type === syncRemoteConfig.type)).toHaveLength(1);
  });

  it("still arms readiness when the cache primed and the fetch then fails", async () => {
    // The offline-with-a-warm-cache case, and the one that must never regress: readiness comes
    // from the call settling, not from its outcome. Short-circuiting the poll because the prime
    // already produced values would leave this user's boot gate shut forever.
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      fetchRemoteFlags: () => Promise.reject(new Error("network down")),
      refreshInterval: 1_000,
    });

    await flushPromises();

    expect(store.getState().featureFlags.remoteFlagsReady).toBe(true);
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });
});

describe("onRemoteFlagsError", () => {
  it("reports each failed poll with a 1-based attempt, cold while no values are held", async () => {
    const onRemoteFlagsError = jest.fn();
    createStore(undefined, {
      fetchRemoteFlags: () => Promise.reject(new Error("network down")),
      refreshInterval: 1_000,
      onRemoteFlagsError,
    });

    await flushPromises();
    expect(onRemoteFlagsError).toHaveBeenCalledWith(expect.any(Error), {
      stage: "remote",
      attempt: 1,
      isCold: true,
    });

    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(onRemoteFlagsError).toHaveBeenLastCalledWith(expect.any(Error), {
      stage: "remote",
      attempt: 2,
      isCold: true,
    });
  });

  it("reports a poll failure as warm once the cache has primed", async () => {
    const onRemoteFlagsError = jest.fn();
    createStore(undefined, {
      readCachedFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      fetchRemoteFlags: () => Promise.reject(new Error("network down")),
      refreshInterval: 1_000,
      onRemoteFlagsError,
    });

    await flushPromises();

    expect(onRemoteFlagsError).toHaveBeenCalledWith(expect.any(Error), {
      stage: "remote",
      attempt: 1,
      isCold: false,
    });
  });

  it("reports a failing cache read and still runs the poll", async () => {
    const onRemoteFlagsError = jest.fn();
    const store = createStore(undefined, {
      readCachedFlags: () => Promise.reject(new Error("storage unavailable")),
      fetchRemoteFlags: () => Promise.resolve({ mockFeature: { enabled: true } }),
      onRemoteFlagsError,
    });

    await flushPromises();

    expect(onRemoteFlagsError).toHaveBeenCalledWith(expect.any(Error), {
      stage: "cache",
      attempt: 1,
      isCold: true,
    });
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("keeps polling when the reporter itself throws", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network down"));
    createStore(undefined, {
      fetchRemoteFlags: fetcher,
      refreshInterval: 1_000,
      onRemoteFlagsError: () => {
        throw new Error("reporter blew up");
      },
    });

    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
