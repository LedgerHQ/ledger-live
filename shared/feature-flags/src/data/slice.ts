import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  type Feature,
  type FeatureId,
  type FeatureFlagsState,
  type PartialFeatures,
} from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import { getResolutionConfig } from "../config";
import { resolveFeature, resolveAll } from "./utils";

export const FEATURE_FLAGS_INITIAL_STATE: FeatureFlagsState = {
  overrides: {},
  remote: {},
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  resolved: FEATURE_FLAGS_DEFAULTS as FeatureFlagsState["resolved"],
  bannerVisible: false,
};

const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState: FEATURE_FLAGS_INITIAL_STATE,
  reducers: {
    setOverride(state, action: PayloadAction<{ key: FeatureId; value: Feature | undefined }>) {
      const { key, value } = action.payload;
      if (value === undefined) {
        delete state.overrides[key];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
        (state.overrides as any)[key] = value;
      }
      const config = getResolutionConfig();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
      (state.resolved as any)[key] = resolveFeature(key, state.overrides, state.remote, config);
    },

    setAllOverrides(state, action: PayloadAction<FeatureFlagsState["overrides"]>) {
      state.overrides = action.payload;
      state.resolved = resolveAll(state.overrides, state.remote, getResolutionConfig());
    },

    syncRemoteConfig(state, action: PayloadAction<PartialFeatures>) {
      state.remote = action.payload;
      state.resolved = resolveAll(state.overrides, state.remote, getResolutionConfig());
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
