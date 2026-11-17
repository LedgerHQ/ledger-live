import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { UNSAFE_OVERRIDE_KEYS, cloneOverridesSafely } from "./internals";

export type LiveConfigOverridesState = {
  overrides: Record<string, unknown>;
};

export type StateWithLiveConfigOverrides = { liveConfigOverrides: LiveConfigOverridesState };

export const LIVE_CONFIG_OVERRIDES_INITIAL_STATE: LiveConfigOverridesState = {
  overrides: {},
};

const liveConfigOverridesSlice = createSlice({
  name: "liveConfigOverrides",
  initialState: LIVE_CONFIG_OVERRIDES_INITIAL_STATE,
  reducers: {
    /** Sets one override, or removes it when `value` is `undefined`. */
    setLiveConfigOverride(state, action: PayloadAction<{ key: string; value: unknown }>) {
      const { key, value } = action.payload;
      if (UNSAFE_OVERRIDE_KEYS.has(key)) return;
      if (value === undefined) {
        delete state.overrides[key];
      } else {
        state.overrides[key] = value;
      }
    },
    /** Replaces the whole overrides map: hydration from storage, or `{}` to restore all. */
    setAllLiveConfigOverrides(state, action: PayloadAction<Record<string, unknown>>) {
      state.overrides = cloneOverridesSafely(action.payload);
    },
  },
  selectors: {
    liveConfigOverridesSelector: state => state.overrides,
    hasLiveConfigOverridesSelector: state => Object.keys(state.overrides).length > 0,
  },
});

export const { setLiveConfigOverride, setAllLiveConfigOverrides } =
  liveConfigOverridesSlice.actions;

export const { liveConfigOverridesSelector, hasLiveConfigOverridesSelector } =
  liveConfigOverridesSlice.selectors;

/** Reducer for the `liveConfigOverrides` slice — register under `state.liveConfigOverrides`. */
export const liveConfigOverridesReducer = liveConfigOverridesSlice.reducer;
