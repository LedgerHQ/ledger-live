import { createAction, type Middleware } from "@reduxjs/toolkit";
import {
  removeAppConfigDevValue,
  resetAppConfigSelection,
  selectAppConfigOption,
  setAppConfigDevValue,
} from "./slice";
import { acceptsDevValue, isAllowedSelection, isSelectable } from "./internals/options";
import { validateValue } from "./internals/validateValue";
import { rejectDevValue, setSession } from "./internals/slice";
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
 * Creates the middleware that holds the storage, the dev value validator and the reload of the
 * session. It sets the `appConfig` slice once the store is created, then saves each selection, reset
 * and dev value the slice accepts to the storage before the slice applies it, so a failed write
 * changes neither. It parses a dev value first, and hands the slice a rejection instead of an
 * invalid one. It reloads on {@link reloadAppConfig} only, so several changes take a single reload.
 */
export function createAppConfigMiddleware({
  session,
  reload,
}: AppConfigMiddlewareConfig): Middleware {
  const { storage, valueSchemas, ...resolvedFrom } = session;

  return ({ dispatch }) => {
    // The slice ignores every change until the session is set, so nothing is saved either.
    let isSessionSet = false;
    // Deferred: Redux forbids dispatching while the middleware chain is still being built.
    void Promise.resolve().then(() => {
      dispatch(setSession(resolvedFrom));
      isSessionSet = true;
    });

    return next => action => {
      const result = next(isSessionSet ? save(action) : action);
      if (reloadAppConfig.match(action)) reload();
      return result;
    };
  };

  /** Saves what `action` changes, and returns the action the slice applies in its place. */
  function save(action: unknown): unknown {
    if (selectAppConfigOption.match(action)) {
      const { id, selectionId } = action.payload;
      if (isAllowedSelection(session, id, selectionId)) storage.selections.set(id, selectionId);
      return action;
    }

    if (resetAppConfigSelection.match(action)) {
      if (isSelectable(session, action.payload)) storage.selections.remove(action.payload);
      return action;
    }

    if (setAppConfigDevValue.match(action)) {
      const { name, value } = action.payload;
      if (acceptsDevValue(session, name)) {
        const message = validateValue(valueSchemas, name, value);
        if (message !== undefined) return rejectDevValue({ name, value, message });
        storage.devValues.set(name, value);
      }
      return action;
    }

    if (removeAppConfigDevValue.match(action)) {
      if (acceptsDevValue(session, action.payload)) storage.devValues.remove(action.payload);
      return action;
    }

    return action;
  }
}
