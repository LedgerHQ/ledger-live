import { createSlice, type PayloadAction, type WritableDraft } from "@reduxjs/toolkit";
import type { FeatureFlagsMeta } from "./middleware";
import type { FeatureId, FeatureFlagsState, PartialFeatures } from "./schema";
import { FEATURE_FLAGS_INITIAL_STATE } from "../constants";
import { resolveFeature, resolveAll } from "./internals";

const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState: FEATURE_FLAGS_INITIAL_STATE,
  reducers: {
    /**
     * Sets or clears a single local override and re-resolves that key. Pass
     * `value: undefined` to remove the override and revert to the remote/default
     * value. Local overrides take priority over env overrides and remote flags.
     */
    setOverride: {
      prepare,
      reducer<T extends FeatureId>(
        state: WritableDraft<FeatureFlagsState>,
        action: PayloadActionWithMeta<{ key: T; value: PartialFeatures[T] | undefined }>,
      ) {
        const { resolutionConfig, remoteFlags } = action.meta;
        const { key, value } = action.payload;
        if (value === undefined) {
          delete state.overrides[key];
        } else {
          state.overrides[key] = value;
        }
        state.resolved[key] = resolveFeature(key, state.overrides, remoteFlags, resolutionConfig);
      },
    },

    /**
     * Replaces the entire local-overrides map and re-resolves every flag.
     * Used for bulk operations like restoring overrides on hydration or
     * clearing all developer overrides at once.
     */
    setAllOverrides: {
      prepare,
      reducer(state, action: PayloadActionWithMeta<FeatureFlagsState["overrides"]>) {
        const { resolutionConfig, remoteFlags } = action.meta;
        state.overrides = action.payload;
        state.resolved = resolveAll(state.overrides, remoteFlags, resolutionConfig);
      },
    },

    /**
     * Re-resolves every flag against the latest remote values. Payload-less:
     * the middleware injects the freshly fetched remote map via
     * `action.meta.remoteFlags`. Dispatched by `createFeatureFlagsMiddleware`
     * after each successful remote fetch.
     */
    syncRemoteConfig: {
      prepare: prepareWithoutPayload,
      reducer(state, action: PayloadActionWithMeta<void>) {
        const { resolutionConfig, remoteFlags } = action.meta;
        state.resolved = resolveAll(state.overrides, remoteFlags, resolutionConfig);
      },
    },

    /** Toggles visibility of the developer feature-flags banner/button in the UI. */
    setBannerVisible(state, action: PayloadAction<boolean>) {
      state.bannerVisible = action.payload;
    },

    /**
     * Marks the first remote-flag fetch as settled (readiness gate). Payload-less and
     * idempotent: the middleware dispatches it once the first fetch settles, whether it
     * resolved or rejected.
     */
    setRemoteFlagsReady(state) {
      state.remoteFlagsReady = true;
    },

    /**
     * Replaces the entire feature-flags state. Used during hydration from
     * persisted storage to restore the slice in a single step.
     */
    importState(_, action: PayloadAction<FeatureFlagsState>) {
      return action.payload;
    },
  },
});

export const {
  setOverride,
  setAllOverrides,
  syncRemoteConfig,
  setBannerVisible,
  setRemoteFlagsReady,
  importState,
} = featureFlagsSlice.actions;

/** Reducer for the `featureFlags` slice — register under `state.featureFlags`. */
export const featureFlagsReducer = featureFlagsSlice.reducer;

/**
 * Ensure valid typing for metadata — see https://redux.js.org/usage/usage-with-typescript#typing-prepare-callbacks.
 * The placeholder meta is overwritten by `createFeatureFlagsMiddleware` on every dispatch; it stays
 * here so direct dispatches in tests remain FSA-valid. `error: false as const` satisfies RTK's
 * Omit constraint on FSA actions.
 */
function prepare<P>(payload: P) {
  const meta: FeatureFlagsMeta = { resolutionConfig: {}, remoteFlags: {} };
  return { payload, meta, error: false as const };
}

/** Variant of {@link prepare} for payload-less actions (e.g. {@link syncRemoteConfig}). */
function prepareWithoutPayload() {
  const meta: FeatureFlagsMeta = { resolutionConfig: {}, remoteFlags: {} };
  return { payload: undefined, meta, error: false as const };
}

/** Typed action shape for reducers that receive meta via middleware. */
type PayloadActionWithMeta<P> = PayloadAction<P, string, FeatureFlagsMeta>;
