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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
        (state.overrides as any)[flagKey] = value;
      }
      const config = getResolutionConfig();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
      (state.resolved as any)[flagKey] = resolveFeature(
        flagKey,
        state.overrides,
        state.remote,
        config,
      );
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
        state.resolved = resolveAll(overrides, state.remote, getResolutionConfig());
      } else {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const overrides = payload as FeatureFlagsState["overrides"];
        state.overrides = overrides;
        state.resolved = resolveAll(overrides, state.remote, getResolutionConfig());
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

    for (const actionType of ["SETTINGS_IMPORT", "FETCH_SETTINGS"] as const) {
      builder.addCase(actionType, (state, action) => {
        const payload =
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          (
            action as PayloadAction<{
              overriddenFeatureFlags?: Record<string, unknown>;
              featureFlagsBannerVisible?: boolean;
              featureFlagsButtonVisible?: boolean;
            }>
          ).payload;
        if (!payload) return;

        if (payload.overriddenFeatureFlags) {
          const filtered = Object.fromEntries(
            Object.entries(payload.overriddenFeatureFlags).filter(([, v]) => v !== undefined),
          );
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          state.overrides = filtered as FeatureFlagsState["overrides"];
          state.resolved = resolveAll(state.overrides, state.remote, getResolutionConfig());
        }

        const bannerValue = payload.featureFlagsBannerVisible ?? payload.featureFlagsButtonVisible;
        if (bannerValue !== undefined) {
          state.bannerVisible = bannerValue;
        }
      });
    }
  },
});

export const { setOverride, setAllOverrides, syncRemoteConfig, setBannerVisible, importState } =
  featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;
