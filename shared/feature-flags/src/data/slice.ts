import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import cloneDeep from "lodash/cloneDeep";
import { type Feature, type FeatureId, type FeatureFlagsState, FeatureIdSchema } from "./schema";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import { getResolutionConfig } from "../config";
import { extractRemoteFlags, resolveFeature, resolveAll } from "./utils";

const initialState: FeatureFlagsState = {
  overrides: {},
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  resolved: cloneDeep(FEATURE_FLAGS_DEFAULTS) as FeatureFlagsState["resolved"],
  bannerVisible: false,
};

const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    setOverride(state, action: PayloadAction<{ key: FeatureId; value: Feature | undefined }>) {
      const { key, value } = action.payload;
      if (value === undefined) {
        delete state.overrides[key];
      } else {
        state.overrides[key] = value;
      }
      const config = getResolutionConfig();
      const remoteFlags = extractRemoteFlags(state.resolved, state.overrides, config.envFlags);
      state.resolved[key] = resolveFeature(key, state.overrides, remoteFlags, config);
    },

    setAllOverrides(state, action: PayloadAction<FeatureFlagsState["overrides"]>) {
      state.overrides = action.payload;
      state.resolved = resolveAll(state.overrides, state.resolved, getResolutionConfig());
    },

    syncRemoteConfig(state, action: PayloadAction<Record<string, Feature>>) {
      const remoteFlags = action.payload;
      const config = getResolutionConfig();
      const allKeys = FeatureIdSchema.options;
      const result: FeatureFlagsState["resolved"] = allKeys.reduce(
        (acc, key) => {
          acc[key] = resolveFeature(key, state.overrides, remoteFlags, config);
          return acc;
        },
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {} as FeatureFlagsState["resolved"],
      );
      for (const key of allKeys) {
        result[key] = resolveFeature(key, state.overrides, remoteFlags, config);
      }
      state.resolved = result;
    },

    setBannerVisible(state, action: PayloadAction<boolean>) {
      state.bannerVisible = action.payload;
    },

    importState(_, action: PayloadAction<FeatureFlagsState>) {
      return action.payload;
    },
  },

  // We use extraReducers to handle legacy actions that are no longer used in the app.
  // This is a temporary solution to avoid breaking changes. We will remove this once
  // we have migrated to the new actions. Also RTK string-based addCase doesn't type
  // payload so we are forced to cast actions.
  extraReducers: builder => {
    builder.addCase("SET_OVERRIDDEN_FEATURE_FLAG", (state, action) => {
      const { key, id, value } =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (action as PayloadAction<{ key?: FeatureId; id?: FeatureId; value: Feature<FeatureId> }>)
          .payload;
      const flagKey = key ?? id;
      if (!flagKey) return;
      if (value === undefined) {
        delete state.overrides[flagKey];
      } else {
        state.overrides[flagKey] = value;
      }
      const config = getResolutionConfig();
      const remoteFlags = extractRemoteFlags(state.resolved, state.overrides, config.envFlags);
      state.resolved[flagKey] = resolveFeature(flagKey, state.overrides, remoteFlags, config);
    });

    builder.addCase("SET_OVERRIDDEN_FEATURE_FLAGS", (state, action) => {
      const payload = // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (action as PayloadAction<{ overriddenFeatureFlags?: FeatureFlagsState["overrides"] }>)
          .payload;
      if (payload == undefined) return;
      if ("overriddenFeatureFlags" in payload) {
        const overrides = payload.overriddenFeatureFlags;
        if (overrides === undefined) return;
        state.overrides = overrides;
        state.resolved = resolveAll(overrides, state.resolved, getResolutionConfig());
      } else {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const overrides = payload as FeatureFlagsState["overrides"];
        state.overrides = overrides;
        state.resolved = resolveAll(overrides, state.resolved, getResolutionConfig());
      }
    });

    builder.addCase("SET_FEATURE_FLAGS_BUTTON_VISIBLE", (state, action) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const payload = (action as PayloadAction<{ featureFlagsButtonVisible?: boolean } | boolean>)
        .payload;
      state.bannerVisible =
        typeof payload === "boolean" ? payload : payload.featureFlagsButtonVisible ?? false;
    });

    builder.addCase("SET_FEATURE_FLAGS_BANNER_VISIBLE", (state, action) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      state.bannerVisible = (action as PayloadAction<boolean>).payload;
    });
  },
});

export const { setOverride, setAllOverrides, syncRemoteConfig, setBannerVisible, importState } =
  featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
