import type { Middleware } from "@reduxjs/toolkit";
import { liveConfigOverridesSelector, type StateWithLiveConfigOverrides } from "./selectors";

export interface LiveConfigOverridesMiddlewareConfig {
  /** Hands the latest overrides map to the host's config, e.g. `LiveConfig.setAllOverrides`. */
  applyOverrides: (overrides: Record<string, unknown>) => void;
}

/** Calls `applyOverrides` after the first action, then each time the overrides map changes. */
export function createLiveConfigOverridesMiddleware({
  applyOverrides,
}: LiveConfigOverridesMiddlewareConfig): Middleware<object, StateWithLiveConfigOverrides> {
  return store => {
    let applied: Record<string, unknown> | undefined;
    return next => action => {
      const result = next(action);
      const overrides = liveConfigOverridesSelector(store.getState());
      if (overrides !== applied) {
        applied = overrides;
        applyOverrides(overrides);
      }
      return result;
    };
  };
}
