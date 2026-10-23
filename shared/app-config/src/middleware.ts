import { createAction, type Middleware } from "@reduxjs/toolkit";
import { resetAppConfigSwitch, selectAppConfigOption } from "./slice";
import { isDeclaredOption, isDeclaredSwitch } from "./internals/options";
import { setSession } from "./internals/slice";
import type { AppConfigSession } from "./types";

/** Starts the next session, which resolves the configuration from the saved selections. */
export const reloadAppConfig = createAction("appConfig/reload");

/** What only the app knows, given to {@link createAppConfigMiddleware} at store creation. */
export interface AppConfigMiddlewareConfig {
  /** What the configuration of this session was resolved from, as `resolveAppConfig` returns it. */
  readonly session: AppConfigSession;
  /** Starts the next session, which resolves the configuration again. */
  readonly reload: () => void;
}

/**
 * Creates the middleware that holds the storage and the reload of the session. It sets the
 * `appConfig` slice once the store is created, then saves each selection and reset of a declared
 * switch to the storage before the slice applies it, so a failed write changes neither. It reloads
 * on {@link reloadAppConfig} only, so several changes take a single reload.
 */
export function createAppConfigMiddleware({
  session,
  reload,
}: AppConfigMiddlewareConfig): Middleware {
  const { storage, ...resolvedFrom } = session;

  return ({ dispatch }) => {
    // The slice ignores selections and resets until the session is set, so nothing is saved either.
    let isSessionSet = false;
    // Deferred: Redux forbids dispatching while the middleware chain is still being built.
    void Promise.resolve().then(() => {
      dispatch(setSession(resolvedFrom));
      isSessionSet = true;
    });

    return next => action => {
      if (isSessionSet && selectAppConfigOption.match(action)) {
        const { switchId, optionId } = action.payload;
        if (isDeclaredOption(session.switches, switchId, optionId)) storage.set(switchId, optionId);
      } else if (isSessionSet && resetAppConfigSwitch.match(action)) {
        if (isDeclaredSwitch(session.switches, action.payload)) storage.remove(action.payload);
      }
      const result = next(action);
      if (reloadAppConfig.match(action)) reload();
      return result;
    };
  };
}
