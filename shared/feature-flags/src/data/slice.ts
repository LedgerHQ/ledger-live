import { createSlice, type PayloadAction, type WritableDraft } from "@reduxjs/toolkit";
import type { FeatureFlagsMeta } from "./middleware";
import type { FeatureId, FeatureFlagsState, PartialFeatures, ResolutionConfig } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import { resolveFeature, resolveAll } from "./utils";

export const FEATURE_FLAGS_INITIAL_STATE: FeatureFlagsState = {
  overrides: {},
  remote: {},
  resolved: FEATURE_FLAGS_DEFAULTS,
  bannerVisible: false,
};

const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState: FEATURE_FLAGS_INITIAL_STATE,
  reducers: {
    setOverride: {
      prepare,
      reducer<T extends FeatureId>(
        state: WritableDraft<FeatureFlagsState>,
        action: PayloadActionWithMeta<{ key: T; value: PartialFeatures[T] | undefined }>,
      ) {
        const config: ResolutionConfig = action.meta.resolutionConfig;
        const { key, value } = action.payload;
        if (value === undefined) {
          delete state.overrides[key];
        } else {
          state.overrides[key] = value;
        }
        state.resolved[key] = resolveFeature(key, state.overrides, state.remote, config);
      },
    },

    setAllOverrides: {
      prepare,
      reducer(state, action: PayloadActionWithMeta<FeatureFlagsState["overrides"]>) {
        const config: ResolutionConfig = action.meta.resolutionConfig;
        state.overrides = action.payload;
        state.resolved = resolveAll(state.overrides, state.remote, config);
      },
    },

    syncRemoteConfig: {
      prepare,
      reducer(state, action: PayloadActionWithMeta<PartialFeatures>) {
        const config: ResolutionConfig = action.meta.resolutionConfig;
        state.remote = action.payload;
        state.resolved = resolveAll(state.overrides, state.remote, config);
      },
    },

    setBannerVisible(state, action: PayloadAction<boolean>) {
      state.bannerVisible = action.payload;
    },

    importState(_, action: PayloadAction<FeatureFlagsState>) {
      return action.payload;
    },
  },
});

export const { setOverride, setAllOverrides, syncRemoteConfig, setBannerVisible, importState } =
  featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;

/**
 * Ensure valid typing for metadata — see https://redux.js.org/usage/usage-with-typescript#typing-prepare-callbacks.
 * Explicit meta type keeps reducer bodies cast-free. `error: false as const` satisfies RTK's FSA Omit constraint.
 */
function prepare<P>(payload: P) {
  const meta: FeatureFlagsMeta = { resolutionConfig: {} };
  return { payload, meta, error: false as const };
}

/** Typed action shape for reducers that receive meta via middleware. */
type PayloadActionWithMeta<P> = PayloadAction<P, string, FeatureFlagsMeta>;
