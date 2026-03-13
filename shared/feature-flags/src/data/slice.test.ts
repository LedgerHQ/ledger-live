/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { configureStore } from "@reduxjs/toolkit";
import reducer, {
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
    reducer: { featureFlags: reducer },
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
      resolved: defaults,
      bannerVisible: false,
    });
    store.dispatch(syncRemoteConfig({ mockFeature: { enabled: false } }));
    expect(store.getState().featureFlags.resolved.mockFeature.enabled).toBe(true);
  });
});

describe("featureFlagsSlice extraReducers (legacy bridge)", () => {
  describe("SET_OVERRIDDEN_FEATURE_FLAG", () => {
    it("handles LLD payload shape (key + value)", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_OVERRIDDEN_FEATURE_FLAG",
        payload: { key: "mockFeature", value: { enabled: true } },
      });
      expect(store.getState().featureFlags.overrides.mockFeature).toEqual({ enabled: true });
      expect(store.getState().featureFlags.resolved.mockFeature).toEqual({ enabled: true });
    });

    it("handles LLM payload shape (id + value)", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_OVERRIDDEN_FEATURE_FLAG",
        payload: { id: "mockFeature", value: { enabled: false, params: { v: 2 } } },
      });
      expect(store.getState().featureFlags.overrides.mockFeature).toEqual({
        enabled: false,
        params: { v: 2 },
      });
    });

    it("removes override when value is undefined", () => {
      const store = createStore({
        overrides: { mockFeature: { enabled: true } },
        resolved: { ...defaults, mockFeature: { enabled: true } },
        bannerVisible: false,
      });
      store.dispatch({
        type: "SET_OVERRIDDEN_FEATURE_FLAG",
        payload: { key: "mockFeature", value: undefined },
      });
      expect(store.getState().featureFlags.overrides.mockFeature).toBeUndefined();
    });
  });

  describe("SET_OVERRIDDEN_FEATURE_FLAGS", () => {
    it("handles LLD payload shape (wrapped in overriddenFeatureFlags)", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_OVERRIDDEN_FEATURE_FLAGS",
        payload: { overriddenFeatureFlags: { mockFeature: { enabled: true } } },
      });
      expect(store.getState().featureFlags.overrides).toEqual({
        mockFeature: { enabled: true },
      });
    });

    it("handles LLM payload shape (direct object)", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_OVERRIDDEN_FEATURE_FLAGS",
        payload: { ptxCard: { enabled: false } },
      });
      expect(store.getState().featureFlags.overrides).toEqual({ ptxCard: { enabled: false } });
    });
  });

  describe("SET_FEATURE_FLAGS_BUTTON_VISIBLE (LLD)", () => {
    it("handles wrapped payload", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_FEATURE_FLAGS_BUTTON_VISIBLE",
        payload: { featureFlagsButtonVisible: true },
      });
      expect(store.getState().featureFlags.bannerVisible).toBe(true);
    });
  });

  describe("SET_FEATURE_FLAGS_BANNER_VISIBLE (LLM)", () => {
    it("handles direct boolean payload", () => {
      const store = createStore();
      store.dispatch({
        type: "SET_FEATURE_FLAGS_BANNER_VISIBLE",
        payload: true,
      });
      expect(store.getState().featureFlags.bannerVisible).toBe(true);
    });
  });
});
