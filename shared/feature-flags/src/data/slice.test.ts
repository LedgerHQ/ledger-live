/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { configureStore } from "@reduxjs/toolkit";
import {
  featureFlagsReducer,
  setOverride,
  setAllOverrides,
  syncRemoteConfig,
  setBannerVisible,
  importState,
} from "./slice";
import { setResolutionConfig } from "../config";
import type { FeatureFlagsState } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";

const defaults = FEATURE_FLAGS_DEFAULTS as FeatureFlagsState["resolved"];

function createStore(preloadedState?: FeatureFlagsState) {
  return configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: preloadedState ? { featureFlags: preloadedState } : undefined,
  });
}

beforeEach(() => {
  setResolutionConfig({});
});

describe("featureFlagsSlice reducers", () => {
  it("has correct initial state", () => {
    const store = createStore();
    expect(store.getState().featureFlags).toEqual({
      overrides: {},
      remote: {},
      resolved: defaults,
      bannerVisible: false,
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
        remote: {},
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
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
        remote: {},
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
      });
      store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
      expect(store.getState().featureFlags.overrides.mockFeature).toBeUndefined();
    });
  });

  describe("setAllOverrides", () => {
    it("replaces the entire overrides map and re-resolves", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: true } },
        remote: {},
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
      });
      store.dispatch(setAllOverrides({ ptxCard: { enabled: false } }));
      expect(store.getState().featureFlags.overrides).toEqual({ ptxCard: { enabled: false } });
      expect(store.getState().featureFlags.overrides.mockFeature).toBeUndefined();
    });
  });

  describe("syncRemoteConfig", () => {
    it("stores remote flags into resolved", () => {
      const store = createStore();
      store.dispatch(
        syncRemoteConfig({
          mockFeature: { enabled: true, params: { v: 1 } },
          ptxCard: { enabled: false },
        }),
      );
      const { resolved } = store.getState().featureFlags;
      expect(resolved.mockFeature).toEqual({ enabled: true, params: { v: 1 } });
      expect(resolved.ptxCard).toEqual({ enabled: false });
    });

    it("local overrides take priority over remote", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: false, overridesRemote: true } },
        remote: {},
        resolved: defaults,
        bannerVisible: false,
      });
      store.dispatch(syncRemoteConfig({ mockFeature: { enabled: true } }));
      expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
        enabled: false,
        overridesRemote: true,
      });
    });
  });

  describe("setBannerVisible", () => {
    it("sets bannerVisible to true", () => {
      const store = createStore();
      store.dispatch(setBannerVisible(true));
      expect(store.getState().featureFlags.bannerVisible).toBe(true);
    });
  });

  describe("importState", () => {
    it("replaces entire state", () => {
      const store = createStore();
      const newState: FeatureFlagsState = {
        overrides: { mockFeature: { enabled: true, params: "test" } },
        remote: {},
        resolved: { ...defaults, mockFeature: { enabled: true, params: "test" } },
        bannerVisible: true,
      };
      store.dispatch(importState(newState));
      expect(store.getState().featureFlags).toEqual(newState);
    });
  });
});

describe("resolution logic", () => {
  it("version filtering disables flag when version does not match", () => {
    setResolutionConfig({ platform: "desktop", appVersion: "1.0.0" });
    const store = createStore();
    store.dispatch(
      syncRemoteConfig({
        mockFeature: { enabled: true, desktop_version: ">=2.0.0" },
      }),
    );
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(false);
    expect(resolved.enabledOverriddenForCurrentVersion).toBe(true);
  });

  it("version filtering keeps flag when version matches", () => {
    setResolutionConfig({ platform: "desktop", appVersion: "3.0.0" });
    const store = createStore();
    store.dispatch(
      syncRemoteConfig({
        mockFeature: { enabled: true, desktop_version: ">=2.0.0" },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("mobile_version is used for ios/android platforms", () => {
    setResolutionConfig({ platform: "ios", appVersion: "1.0.0" });
    const store = createStore();
    store.dispatch(
      syncRemoteConfig({
        mockFeature: { enabled: true, mobile_version: ">=2.0.0" },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);
  });

  it("language whitelist disables flag when language is not whitelisted", () => {
    setResolutionConfig({ appLanguage: "de" });
    const store = createStore();
    store.dispatch(
      syncRemoteConfig({
        mockFeature: { enabled: true, languages_whitelisted: ["en", "fr"] },
      }),
    );
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(false);
    expect(resolved.enabledOverriddenForCurrentLanguage).toBe(true);
  });

  it("language blacklist disables flag when language is blacklisted", () => {
    setResolutionConfig({ appLanguage: "de" });
    const store = createStore();
    store.dispatch(
      syncRemoteConfig({
        mockFeature: { enabled: true, languages_blacklisted: ["de"] },
      }),
    );
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);
  });

  it("language filtering does not apply to local overrides", () => {
    setResolutionConfig({ appLanguage: "de" });
    const store = createStore({
      overrides: { mockFeature: { enabled: true, languages_whitelisted: ["en"] } },
      remote: {},
      resolved: defaults,
      bannerVisible: false,
    });
    store.dispatch(syncRemoteConfig({}));
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });

  it("env flags override remote config", () => {
    setResolutionConfig({
      envFlags: { mockFeature: { enabled: true, params: { envOverride: true } } },
    });
    const store = createStore();
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: false } }));
    const resolved = store.getState().featureFlags.resolved.mockFeature;
    expect(resolved.enabled).toBe(true);
    expect(resolved.overriddenByEnv).toBe(true);
    expect(resolved.overridesRemote).toBe(true);
  });

  it("resolution priority: local override > env > remote", () => {
    setResolutionConfig({
      envFlags: { mockFeature: { enabled: false } },
    });
    const store = createStore({
      overrides: { mockFeature: { enabled: true, overridesRemote: true } },
      remote: {},
      resolved: defaults,
      bannerVisible: false,
    });
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: false } }));
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });
});

describe("remote state management", () => {
  it("syncRemoteConfig persists raw remote values in state.remote", () => {
    const store = createStore();
    const remotePayload = {
      mockFeature: { enabled: true, params: { v: 1 } },
      ptxCard: { enabled: false },
    };
    store.dispatch(syncRemoteConfig(remotePayload));
    expect(store.getState().featureFlags.remote).toEqual(remotePayload);
  });

  it("syncRemoteConfig replaces previous remote values", () => {
    const store = createStore();
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: true } }));
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: false, params: { v: 2 } } }));
    expect(store.getState().featureFlags.remote).toEqual({
      mockFeature: { enabled: false, params: { v: 2 } },
    });
  });

  it("removing an override reverts to stored remote value", () => {
    const store = createStore();
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: true, params: { remote: true } } }));
    store.dispatch(setOverride({ key: "mockFeature", value: { enabled: false } }));
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(false);

    store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { remote: true },
    });
  });

  it("removing an override falls back to default when no remote exists", () => {
    const store = createStore();
    store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
    store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual(defaults.mockFeature);
  });

  it("setAllOverrides uses stored remote values for non-overridden flags", () => {
    const store = createStore();
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: true, params: { v: 1 } } }));
    store.dispatch(setAllOverrides({ ptxCard: { enabled: true } }));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { v: 1 },
    });
    expect(store.getState().featureFlags.resolved.ptxCard.enabled).toBe(true);
  });

  it("clearing all overrides reverts every flag to remote or default", () => {
    const store = createStore();
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: true, params: { v: 1 } } }));
    store.dispatch(setOverride({ key: "mockFeature", value: { enabled: false } }));
    store.dispatch(setAllOverrides({}));
    expect(store.getState().featureFlags.resolved.mockFeature).toEqual({
      enabled: true,
      params: { v: 1 },
    });
  });

  it("remote values are not mutated by override operations", () => {
    const store = createStore();
    const remoteValue = { enabled: true, params: { original: true } };
    store.dispatch(syncRemoteConfig({ mockFeature: remoteValue }));
    store.dispatch(setOverride({ key: "mockFeature", value: { enabled: false } }));
    store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
    expect(store.getState().featureFlags.remote.mockFeature).toEqual(remoteValue);
  });

  it("importState preserves the remote field", () => {
    const store = createStore();
    const newState: FeatureFlagsState = {
      overrides: {},
      remote: { mockFeature: { enabled: true, params: { imported: true } } },
      resolved: { ...defaults, mockFeature: { enabled: true, params: { imported: true } } },
      bannerVisible: false,
    };
    store.dispatch(importState(newState));
    expect(store.getState().featureFlags.remote).toEqual(newState.remote);
  });
});
