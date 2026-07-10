import type { Middleware } from "@reduxjs/toolkit";
import { setLastFailureTime } from "@domain/entity-client-identity";
import {
  type SyncMiddlewareConfig,
  type Dispatch,
  shouldSync,
  attemptSync,
} from "./internals/middleware";

export type { SyncMiddlewareConfig };

export function createIdentitiesSyncMiddleware<State>(
  rawConfig: SyncMiddlewareConfig<State>,
): Middleware {
  const config = { ...rawConfig, pushDevicesServiceUrl: rawConfig.pushDevicesServiceUrl.trim() };
  let isSyncing = false;
  function sync(state: State, dispatch: Dispatch) {
    isSyncing = true;
    attemptSync(state, config, dispatch)
      .catch(() => {
        setLastFailureTime(Date.now());
      })
      .finally(() => {
        isSyncing = false;
      });
  }

  return store => next => action => {
    if (!isSyncing) {
      const result = next(action);
      const state = store.getState();
      if (shouldSync(state, config)) {
        sync(state, store.dispatch);
      }
      return result;
    }
    return next(action);
  };
}
