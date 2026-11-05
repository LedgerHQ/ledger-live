import type { LiveConfigOverridesState } from "./slice";

export type StateWithLiveConfigOverrides = { liveConfigOverrides: LiveConfigOverridesState };

export const liveConfigOverridesSelector = (state: StateWithLiveConfigOverrides) =>
  state.liveConfigOverrides.overrides;

export const hasLiveConfigOverridesSelector = (state: StateWithLiveConfigOverrides) =>
  Object.keys(state.liveConfigOverrides.overrides).length > 0;
