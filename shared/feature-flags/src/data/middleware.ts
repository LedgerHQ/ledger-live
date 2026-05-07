import type { Action, Middleware } from "@reduxjs/toolkit";
import { isAction } from "@reduxjs/toolkit";
import type { ResolutionConfig } from "./schema";

/** Feature-flags metadata that is dispatched by the middleware for each reducer actions. */
export interface FeatureFlagsMeta {
  resolutionConfig: ResolutionConfig;
}

/**
 * Creates a Redux middleware that injects `resolutionConfig` into the meta of
 * every `featureFlags/*` action, so reducers can read it as plain action data
 * instead of pulling from a global singleton.
 *
 * @param config
 * Platform, version, language, and env-flag overrides. Bound at store creation
 * and closed over for the lifetime of the store.
 */
export function createFeatureFlagsMiddleware(config: ResolutionConfig): Middleware {
  return () => next => action => {
    if (isAction(action) && action.type.startsWith("featureFlags/")) {
      return next({
        ...action,
        meta: { ...getMeta(action), resolutionConfig: config },
      });
    }
    return next(action);
  };
}

/**
 * Extracts any existing `meta` from an action so it can be preserved when the
 * middleware spreads its own meta on top. `Action<string>` does not carry a
 * `meta` field in its type, so the presence check is done at runtime.
 *
 * @param action
 * The intercepted Redux action.
 *
 * @returns
 * The existing meta object, or an empty object if absent or not an object.
 */
function getMeta(action: Action<string>) {
  return "meta" in action && typeof action.meta === "object" && action.meta !== null
    ? action.meta
    : {};
}
